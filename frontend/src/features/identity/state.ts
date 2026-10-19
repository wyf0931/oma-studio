import type * as DTO from "../../shared/types";

export function createIdentityState() {
  return {
    usersOpen: false,
    authChecked: false,
    authUser: null as DTO.User | null,
    loginUsername: "",
    loginPassword: "",
    loginLoading: false,
    loginError: "",
    users: [] as DTO.User[],
    usersLoading: false,
    userAddOpen: false,
    userCreating: false,
    userDeleteTarget: null as DTO.User | null,
    logoutConfirmOpen: false,
    profileMenuOpen: false,
    newUserUsername: "",
    newUserEmail: "",
    sessionExpired: false,
  };
}
