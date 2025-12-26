export const getGeminiResponse = async (history, message) => {
  const response = await fetch("/api/chat", { // Gọi đến function vừa tạo
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history, message }),
  });
  const data = await response.json();
  return data.text;
};