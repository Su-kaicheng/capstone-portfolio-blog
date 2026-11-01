import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";

function renderAt(route) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("client smoke test", () => {
  it("renders the login page for guests", async () => {
    renderAt("/login");
    expect(await screen.findByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders the 404 page for unknown routes", async () => {
    renderAt("/this-page-does-not-exist");
    expect(await screen.findByRole("heading", { name: /could not be found/i })).toBeInTheDocument();
  });
});
