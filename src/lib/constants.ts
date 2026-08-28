/** Internal admin identity — never shown in public UI */
export const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim() || "";

/** Set via NEXT_PUBLIC_ADMIN_INITIAL_PIN — applied once if no PIN exists yet. */
export const ADMIN_INITIAL_PIN =
  process.env.NEXT_PUBLIC_ADMIN_INITIAL_PIN?.trim() || "284719";
