import aj from '#config/arcjet.js';
import logger from '#config/logger.js';
import { slidingWindow } from '@arcjet/node';
const RATE_LIMIT_CONFIG = {
    guest: {
        limit: 5,
        message: 'Guest request limit exceeded (5 requests per minute)',
    },
    user: {
        limit: 10,
        message: 'User request limit exceeded (10 requests per minute)',
    },
    admin: {
        limit: 20,
        message: 'Admin request limit exceeded (20 requests per minute)',
    },
};

const RATE_LIMIT_CLIENTS = {
    guest: aj.withRule(
        slidingWindow({
            mode: 'LIVE',
            interval: 60,
            max: RATE_LIMIT_CONFIG.guest.limit,
            characteristics: ['ip.src'],
        })
    ),
    user: aj.withRule(
        slidingWindow({
            mode: 'LIVE',
            interval: 60,
            max: RATE_LIMIT_CONFIG.user.limit,
            characteristics: ['ip.src'],
        })
    ),
    admin: aj.withRule(
        slidingWindow({
            mode: 'LIVE',
            interval: 60,
            max: RATE_LIMIT_CONFIG.admin.limit,
            characteristics: ['ip.src'],
        })
    ),
};

const securityMiddleware = async (req, res, next) => {
    try {
        const incomingRole = req.user?.role;
        const role = RATE_LIMIT_CONFIG[incomingRole] ? incomingRole : 'guest';
        const { limit, message } = RATE_LIMIT_CONFIG[role];
        const client = RATE_LIMIT_CLIENTS[role];

        console.log('[security.middleware] Request reached middleware', {
            method: req.method,
            path: req.path,
            ip: req.ip,
            incomingRole: incomingRole || null,
            appliedRole: role,
            hasArcjetKey: Boolean(process.env.ARCJET_KEY),
        });

        if (!req.user) {
            console.log('[security.middleware] req.user is missing before rate limiting; guest policy is being applied.');
        }

        console.log('[security.middleware] Calling Arcjet protect(req)', {
            method: req.method,
            path: req.path,
            appliedRole: role,
            limit,
        });

        // ตรวจ request
        const decision = await client.protect(req);
        const isDenied = decision.isDenied();
        const isAllowed = decision.isAllowed();
        const isErrored = decision.isErrored();
        const isRateLimited = decision.reason?.isRateLimit?.() || false;

        console.log('[security.middleware] Arcjet decision summary', {
            id: decision.id,
            conclusion: decision.conclusion,
            isAllowed,
            isDenied,
            isErrored,
            reasonType: decision.reason?.type,
            isRateLimited,
            rateLimit: isRateLimited
                ? {
                    max: decision.reason.max,
                    remaining: decision.reason.remaining,
                    resetTime: decision.reason.resetTime,
                    window: decision.reason.window,
                }
                : null,
        });
        console.log('[security.middleware] Arcjet decision object', decision);

        if (isErrored) {
            logger.error('Arcjet decision errored (fail-open likely)', {
                path: req.path,
                method: req.method,
                ip: req.ip,
                reasonType: decision.reason?.type,
                reasonMessage: decision.reason?.message,
                hasArcjetKey: Boolean(process.env.ARCJET_KEY),
            });
        }
        // ถ้าโดน block
        if (isDenied) {

            // block bot
            if (decision.reason.isBot()) {

                logger.warn('Bot request blocked', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    path: req.path,
                    method: req.method,
                });

                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Automated requests are not allowed',
                });
            }

            // block โดย shield
            if (decision.reason.isShield()) {

                logger.warn('Shield blocked request', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    path: req.path,
                    method: req.method,
                });

                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Request blocked by security policy',
                });
            }

            // rate limit
            if (decision.reason.isRateLimit()) {

                logger.warn('Rate limit exceeded', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    path: req.path,
                    method: req.method,
                    role,
                    limit,
                });

                return res.status(429).json({
                    error: 'Too Many Requests',
                    message,
                });
            }
        }

        // ผ่าน security
        next();

    } catch (e) {

        console.error('Arcjet middleware error:', e);

        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Something went wrong with security middleware',
        });
    }
};

export default securityMiddleware;