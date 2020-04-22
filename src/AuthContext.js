/* eslint-disable react/prop-types */
import React, { useContext, useState } from 'react';

const AuthContext = React.createContext({});

export const AuthProvider = ({ children, initialValue }) => {
  const [token, setToken] = useState();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const logIn = newToken => {
    setToken(newToken);
    setIsLoggedIn(true);
  };

  const defaults = { token, logIn, isLoggedIn };

  console.log('isLoggedIn', isLoggedIn);
  return <AuthContext.Provider value={initialValue || defaults}>{children}</AuthContext.Provider>;
};

export const withAuthProvider = Component => props => {
  const { initialValue, ...rest } = props;
  return (
    <AuthProvider initialValue={initialValue}>
      <Component {...rest} />
    </AuthProvider>
  );
};

export const useAuth = () => {
  const { isLoggedIn, token, logIn } = useContext(AuthContext);
  return { isLoggedIn, token, logIn };
};
