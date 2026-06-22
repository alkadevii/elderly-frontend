export const BASE_URL = "http://localhost:5000/api";

export async function handleResponse(response: Response) {
  if (!response.ok) {
    const text = await response.text();
    let message: string;
    try {
      const data = JSON.parse(text);
      message = data.message || `Request failed with status ${response.status}`;
    } catch {
      message = `Request failed with status ${response.status}`;
    }
    throw new Error(message);
  }
  return response.json();
}
