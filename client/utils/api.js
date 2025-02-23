const API_BASE_URL = "http://localhost:5001/api"; // Update if needed

// ✅ List Ticket for Resale
export const listTicketForResale = async (ticketId, price) => {
  const response = await fetch(`${API_BASE_URL}/tickets/resale`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketId, price }),
  });
  return response.json();
};

// ✅ Fetch Resale Tickets
export const getResaleTickets = async () => {
  const response = await fetch(`${API_BASE_URL}/tickets/resale`);
  return response.json();
};

// ✅ Buy Resale Ticket
export const buyResaleTicket = async (ticketId) => {
  const response = await fetch(`${API_BASE_URL}/tickets/resale/buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketId }),
  });
  return response.json();
};

// ✅ Get Ticket History (Ownership Transfers)
export const getTicketHistory = async (ticketId) => {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/history`);
  return response.json();
};

// ✅ Withdraw Organizer Earnings
export const withdrawEarnings = async (eventId) => {
  const response = await fetch(`${API_BASE_URL}/organizer/withdraw/${eventId}`, {
    method: "POST",
  });
  return response.json();
};
