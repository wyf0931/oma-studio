export function createSettingsState() {
  return {
    settingsOpen: false,
    settingsTab: "general",
    accountProfile: { nickname: "", email: "" },
    accountProfileSaving: false,
    accountProfileError: "",
    accountProfileSaved: false,
    accountPasswordOpen: false,
    accountCurrentPassword: "",
    accountNewPassword: "",
    accountShowCurrentPassword: false,
    accountShowNewPassword: false,
    accountPasswordSaving: false,
    accountPasswordErrors: { current: "", new: "", form: "" },
    accountPasswordSaved: false,
    systemTimezone: "",
    themePreference: "system",
    theme: "light",
    systemThemeQuery: null as MediaQueryList | null,
  };
}
