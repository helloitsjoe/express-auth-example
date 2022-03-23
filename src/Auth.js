/* eslint-disable react/prop-types */
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { login, sendSecure, signUp, logOut, checkLoggedIn } from './services';
import { withAuthProvider, useAuth } from './AuthContext';
import { Button, Input, TitleWrap, SendFormWrapper } from './Components';
import { Actions } from './Login';

const FormColumn = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 20em;
`;

const useForm = (initialValues) => {
  const [values, setValues] = React.useState(initialValues);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetForm = () => {
    setValues(initialValues);
  };

  return { handleChange, handleResetForm, values };
};

const queryReducer = (s, a) => {
  switch (a.type) {
    case 'fetch':
      return { ...s, status: 'LOADING', errorMessage: '' };
    case 'fetch_success':
      console.log(`success:`, a.payload);
      return {
        ...s,
        status: 'SUCCESS',
        data: a.payload,
        fetchFn: login,
        buttonText: 'Log In',
      };
    case 'fetch_error':
      console.log(`error:`, a.payload);
      return { ...s, status: 'ERROR', errorMessage: a.payload };
    case 'clear_error':
      return { ...s, status: 'IDLE', errorMessage: '' };
    case 'logout':
      return { ...s, status: 'LOADING', errorMessage: '' };
    case 'logout_success':
      return { ...s, status: 'IDLE', data: null, fetchFn: s.fetchFn };
    case 'login_expired':
      return { ...s, status: 'IDLE', data: null };
    // case 'toggle_form': {
    //   const fetchFn = s.fetchFn === login ? signUp : login;
    //   const buttonText = s.buttonText === 'Log In' ? 'Sign Up' : 'Log In';
    //   return { ...s, fetchFn, buttonText };
    // }
    default:
      return s;
  }
};

const useFetch = () => {
  const [state, dispatch] = React.useReducer(queryReducer, {
    status: 'IDLE',
    data: null,
    errorMessage: '',
    // fetchFn: signUp,
    // buttonText: 'Sign Up',
  });

  return { ...state, dispatch };
};

const Form = ({ id, action }) => {
  const { handleChange, handleResetForm, values } = useForm({
    username: '',
    password: '',
  });
  const { authLogIn, authLogOut, isLoggedIn, token } = useAuth();
  const { status, errorMessage, dispatch } = useFetch();

  const passwordRef = useRef();

  const endpoint = `/${id}`;
  const isLoading = status === 'LOADING';
  const getButtonText = () => {
    if (isLoading) return 'Loading...';
    return action === Actions.LOGIN ? 'Log In' : 'Sign Up';
  };
  const fetchFn = action === Actions.LOGIN ? login : signUp;

  useEffect(() => {
    if (!token) return;

    checkLoggedIn({ endpoint, token })
      .then((res) => {
        console.log(`res.data:`, res.data);
        const { username } = res.data.user;
        console.log(`username:`, username);
        authLogIn({ username, token });
      })
      .catch((err) => {
        console.log(`err:`, err);
        authLogOut();
        const { message } = (err.response && err.response.data) || err;
        if (!message.match(/expired/i)) {
          return dispatch({
            type: 'fetch_error',
            payload: message || err.response.status,
          });
        }
        // TODO: Refresh token
        console.log('Expired token, logging out...');
        return dispatch({ type: 'login_expired' });
      });
  }, [token, endpoint]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e) => {
    e.preventDefault();
    const { username, password } = values;

    dispatch({ type: 'fetch' });
    fetchFn({ endpoint, username, password, token })
      .then((res) => {
        // TODO: Use sid instead of token
        console.log(res.data);
        authLogIn({ username, token: res.data.token });
        handleResetForm();
        dispatch({ type: 'fetch_success', payload: res.data });
      })
      .catch((err) => {
        const { message } = (err.response && err.response.data) || err;
        dispatch({
          type: 'fetch_error',
          payload: message || err.response.status,
        });
      });
  };

  const handleLogOut = (e) => {
    e.preventDefault();
    dispatch({ type: 'logout' });

    authLogOut();
    if (endpoint.match(/jwt/)) return dispatch({ type: 'logout_success' });

    return logOut({ endpoint, token })
      .then((res) => {
        console.log('logged out', res.data);
        authLogOut();
        dispatch({ type: 'logout_success' });
      })
      .catch((err) => {
        authLogOut();
        const { message } = (err.response && err.response.data) || err;
        dispatch({
          type: 'fetch_error',
          payload: message || err.response.status,
        });
      });
  };

  return (
    <form onSubmit={isLoggedIn ? handleLogOut : handleSubmit}>
      <FormColumn>
        {isLoggedIn ? (
          <Button
            secondary
            fullWidth
            data-testid={`${id}-logout`}
            type="submit"
          >
            Log Out
          </Button>
        ) : (
          <>
            <Input
              autoFocus
              data-testid={`${id}-login-input`}
              placeholder="Name"
              name="username"
              value={values.username}
              onChange={handleChange}
            />
            <Input
              name="password"
              data-testid={`${id}-password-input`}
              placeholder="Password"
              ref={passwordRef}
              value={values.password}
              onChange={handleChange}
            />
            <Button
              fullWidth
              data-testid={`${id}-login-submit`}
              type="submit"
              disabled={isLoading}
            >
              {getButtonText()}
            </Button>
          </>
        )}
        {status === 'ERROR' && <h3 className="error">Error: {errorMessage}</h3>}
        {/* {data && <pre>{JSON.stringify(data, null, 2)}</pre>} */}
      </FormColumn>
    </form>
  );
};

// MAYBE: Move this and Form into single component so useFetch works for both?
const SendMessage = ({ id }) => {
  const { handleChange, values } = useForm({ secureMessage: '' });
  const { status, data, errorMessage, dispatch } = useFetch();
  const { token, isLoggedIn } = useAuth();

  const endpoint = `/${id}`;
  const isLoading = status === 'LOADING';

  useEffect(() => {
    dispatch({ type: 'clear_error' });
  }, [isLoggedIn, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const { secureMessage } = values;

    dispatch({ type: 'fetch' });
    sendSecure({ endpoint, message: secureMessage, token })
      .then((res) => {
        dispatch({ type: 'fetch_success', payload: res.data });
      })
      .catch((err) => {
        const { message: errMessage } =
          (err.response && err.response.data) || err;
        dispatch({
          type: 'fetch_error',
          payload: errMessage || err.response.status,
        });
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <SendFormWrapper>
        <Input
          group
          placeholder="Send a message"
          name="secureMessage"
          data-testid={`${id}-input`}
          value={values.secureMessage}
          onChange={handleChange}
        />
        <Button data-testid={`${id}-submit`} type="submit" disabled={isLoading}>
          Send
        </Button>
      </SendFormWrapper>
      {status === 'ERROR' && <h3 className="error">Error: {errorMessage}</h3>}
      {isLoading && <span>Loading...</span>}
      {/* {isLoggedIn && data && <pre>{JSON.stringify(data, null, 2)}</pre>} */}
      {isLoggedIn && data && <pre>{data.message}</pre>}
    </form>
  );
};

const Auth = ({ id, title, action }) => {
  const { isLoggedIn, username } = useAuth();

  return (
    <>
      <TitleWrap>
        <h3 style={{ display: 'inline' }}>{title}</h3>
        {isLoggedIn ? (
          <span style={{ color: 'limegreen' }}> Logged in as {username}</span>
        ) : (
          <span style={{ color: 'gray' }}> Logged out</span>
        )}
      </TitleWrap>
      <Form id={id} action={action} />
      <SendMessage id={id} />
    </>
  );
};

export default withAuthProvider(Auth);
