
export const pingEndpoint = async (url: string): Promise<number> => {
    const startTime = performance.now();
    try {
        await fetch(url, { method: "HEAD" });
    } catch (error) {
        console.error(`Failed to ping ${url}:`, error);
    }
    const endTime = performance.now();
    return endTime - startTime;
};