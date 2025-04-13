export async function getBackendAPI() {
    const isLocalhost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (isLocalhost) {
        return "http://127.0.0.1:8000/api";
    }

    return "https://hermex-api-307445798493.asia-southeast1.run.app/api";
}
