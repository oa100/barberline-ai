import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsForm } from "./settings-form";

const defaultData = {
  name: "Test Barbershop",
  timezone: "America/New_York",
  greeting: "Hello there!",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("SettingsForm", () => {
  it("renders form with initial data", () => {
    render(<SettingsForm initialData={defaultData} />);

    const nameInput = screen.getByLabelText("Shop Name") as HTMLInputElement;
    const timezoneInput = screen.getByLabelText("Timezone") as HTMLInputElement;

    expect(nameInput.value).toBe("Test Barbershop");
    expect(timezoneInput.value).toBe("America/New_York");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("updates input values on change", () => {
    render(<SettingsForm initialData={defaultData} />);

    const nameInput = screen.getByLabelText("Shop Name") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "New Name" } });
    expect(nameInput.value).toBe("New Name");

    const timezoneInput = screen.getByLabelText("Timezone") as HTMLInputElement;
    fireEvent.change(timezoneInput, {
      target: { value: "America/Chicago" },
    });
    expect(timezoneInput.value).toBe("America/Chicago");
  });

  it("calls fetch with PUT on save", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    render(<SettingsForm initialData={defaultData} />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Barbershop",
          timezone: "America/New_York",
        }),
      });
    });
  });

  it("shows saving state while request in progress", async () => {
    let resolveFetch: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    global.fetch = vi.fn().mockReturnValue(fetchPromise);

    render(<SettingsForm initialData={defaultData} />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByRole("button", { name: "Saving..." })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();

    resolveFetch!({ ok: true });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });
  });
});
