
import { config } from "dotenv";
config({ path: "./.env" });

const key = process.env.OPENAI_API_KEY;
console.log("OPENAI_API_KEY present?", !!key);
if (key) {
    console.log("Key length:", key.length);
    console.log("Key starts with:", key.substring(0, 3));
} else {
    console.log("Keys in env:", Object.keys(process.env).filter(k => k.includes("API")));
}
