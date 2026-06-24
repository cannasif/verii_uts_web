export interface DevLoginDefaults {
  branchId: string;
  email: string;
  password: string;
  rememberMe: boolean;
}

const emptyDefaults: DevLoginDefaults = {
  branchId: '',
  email: '',
  password: '',
  rememberMe: false,
};

export function getDevLoginDefaultValues(): DevLoginDefaults {
  if (!import.meta.env.DEV) {
    return emptyDefaults;
  }

  const email = import.meta.env.VITE_DEV_LOGIN_EMAIL?.trim() ?? '';
  const password = import.meta.env.VITE_DEV_LOGIN_PASSWORD ?? '';

  if (!email && !password) {
    return emptyDefaults;
  }

  return {
    branchId: '1',
    email,
    password,
    rememberMe: true,
  };
}
