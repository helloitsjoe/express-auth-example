/* eslint-disable react/prop-types */
import React, { useContext, useLayoutEffect, useState } from 'react';

const AuthContext = React.createContext({});

export const AuthProvider = ({ children, initialValue, id }) => {
  const [state, setState] = useState({
    isLoggedIn: false,
    token: '',
    username: '',
  });

  useLayoutEffect(() => {
    // TODO: Use cookies instead of localhost?
    const { token, username, isLoggedIn } =
      JSON.parse(localStorage.getItem(`auth${id}`)) || {};

    setState({ token, username, isLoggedIn });
  }, [id]);

  const authLogIn = ({ username, token }) => {
    const isLoggedIn = true;
    localStorage.setItem(
      `auth${id}`,
      JSON.stringify({ token, username, isLoggedIn })
    );
    setState({ token, username, isLoggedIn });
  };

  const authLogOut = () => {
    const isLoggedIn = false;
    localStorage.setItem(`auth${id}`, JSON.stringify({ isLoggedIn }));
    setState({ isLoggedIn, username: '', token: '' });
  };

  const value = { ...state, authLogIn, authLogOut };

  return (
    <AuthContext.Provider value={initialValue || value}>
      {children}
    </AuthContext.Provider>
  );
};

export const withAuthProvider = (Component) => (props) => {
  const { initialValue, ...rest } = props;
  return (
    <AuthProvider initialValue={initialValue} id={props.id}>
      <Component {...rest} />
    </AuthProvider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
