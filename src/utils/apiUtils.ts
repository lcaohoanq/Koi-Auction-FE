import { environment } from "../environments/environment.ts";

const API_URL = `${environment.be.baseUrl}${environment.be.apiPrefix}`; // Adjust this URL to match your backend URL

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "An error occurred during login");
  }

  return response.json();
};

export const register = async (
  name: string,
  email: string,
  password: string,
) => {
  const response = await fetch(`${API_URL}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || "An error occurred during registration",
    );
  }

  return response.json();
};

export const fetchGoogleClientId = async () => {
  try {
    const response = await fetch(`${API_URL}/oauth2/google-client-id`);
    if (!response.ok) {
      throw new Error("Failed to fetch Google client ID");
    }
    const data = await response.json();
    return data.clientId;
  } catch (error) {
    console.error("Error fetching Google client ID:", error);
    return null;
  }
};
