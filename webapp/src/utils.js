
export async function fetcher(...args) {
    let resp = await fetch(...args);
    return await resp.json();
}