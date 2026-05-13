import arcjet, { shield, detectBot } from "@arcjet/node";
const arcjetKey = process.env.ARCJET_KEY;

if (!arcjetKey) {
    console.error("[Arcjet] ARCJET_KEY is not set. Arcjet may fail open and rate limiting will not work.");
}

const aj = arcjet({
    key: arcjetKey,
    rules: [
        shield({ mode: "LIVE" }),

        detectBot({
            mode: "LIVE",
            allow: [
                "CATEGORY:SEARCH_ENGINE",
                "CATEGORY:PREVIEW",
            ],
        }),
    ],
});

export default aj;