/* eslint-disable react/prop-types */
import React, { useState, useContext } from 'react';
// import PropTypes from 'prop-types';
import styled from 'styled-components';

const LoginContext = React.createContext();
const TabContext = React.createContext();

const LoginWrapper = styled.div`
  margin: 50px auto;
  width: 30em;
  border-radius: 16px;
  box-shadow: 0px 5px 20px -5px gray;
  overflow: hidden;
`;

const MainContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 2em;
`;

// const MainWrapper = styled.div`
//   /* margin: auto; */
// `;

const Tab = styled.button`
  border: none;
  background: none;
  width: 100%;
  padding: 1em;
  color: ${(props) => (props.active ? 'black' : 'gray')};
  background-color: ${(props) => (props.active ? 'white' : '#eee')};
  font-weight: ${(props) => (props.active ? 'bold' : 'regular')};
  border-right: 1px solid white;
  &:last-child {
    border-right: none;
  }
  &:focus {
    outline: none;
    box-shadow: 0px ${({ placement }) => (placement === 'top' ? '3px' : '-3px')}
      0px inset dodgerblue;
    /* border-bottom: 3px solid red; */
  }
`;

export const TabGroupWrap = styled.div`
  display: flex;
`;

export const Actions = {
  LOGIN: 'LOGIN',
  SIGN_UP: 'SIGN_UP',
};

const getInitialId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
};

const Login = ({ children, config = {} }) => {
  const [currentId, setCurrentId] = useState(
    getInitialId() || Object.keys(config)[0]
  );
  const [currentAction, setCurrentAction] = useState(Actions.LOGIN);

  console.log(`currentId:`, currentId);

  return (
    <LoginContext.Provider
      value={{
        currentId,
        setCurrentId,
        currentAction,
        setCurrentAction,
        config,
      }}
    >
      <LoginWrapper>{children}</LoginWrapper>
    </LoginContext.Provider>
  );
};

export const TabGroup = ({ children, placement = 'top' }) => {
  return (
    <TabContext.Provider value={{ placement }}>
      <TabGroupWrap role="tablist">{children}</TabGroupWrap>
    </TabContext.Provider>
  );
};

export const AuthTab = ({ children, id }) => {
  const { currentId, setCurrentId } = useContext(LoginContext);
  const { placement } = useContext(TabContext);

  return (
    <Tab
      role="tab"
      aria-selected={id === currentId}
      aria-controls={id}
      placement={placement}
      active={id === currentId}
      onClick={() => setCurrentId(id)}
    >
      {children}
    </Tab>
  );
};

export const LoginTab = ({ children, action }) => {
  const { currentAction, setCurrentAction } = useContext(LoginContext);
  const { placement } = useContext(TabContext);

  return (
    <Tab
      role="tab"
      placement={placement}
      active={currentAction === action}
      onClick={() => setCurrentAction(action)}
    >
      {children}
    </Tab>
  );
};

export const Main = () => {
  const { currentId, currentAction, config } = useContext(LoginContext);
  const { Component, ...props } = config[currentId];

  return (
    <MainContainer>
      <div role="tabpanel">
        <Component key={currentId} action={currentAction} {...props} />
      </div>
    </MainContainer>
  );
};

// export const MainSwitch = ({ children }) => {
//   const { currentId, ids } = useContext(LoginContext);
//   return children;
// };

export default Login;
