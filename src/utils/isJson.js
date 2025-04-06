export function isJsonString(parsed) {
    try {
        // const parsed = JSON.parse(str);
    console.log("hello");
        return Array.isArray(parsed) && parsed.every(img => typeof img === "string");
    } catch (e) {
        return false;
    }
}
