import React from 'react';
import Auth from './Auth';
import Login, { LoginTab, AuthTab, TabGroup, Main, Actions } from './Login';
import OAuth from './OAuth';
// TODO: Passport
// import Passport from './Passport';

const config = {
  jwt: { id: 'jwt', title: 'JWT', Component: Auth },
  'simple-token': {
    id: 'simple-token',
    title: 'Simple Token',
    Component: Auth,
  },
  session: { id: 'session', title: 'Session', Component: Auth },
  oauth: { id: 'oauth', title: 'OAuth', Component: OAuth },
};

export default function App() {
  return (
    <Login config={config}>
      <TabGroup placement="top">
        <AuthTab id="jwt">JWT</AuthTab>
        <AuthTab id="simple-token">Simple Token</AuthTab>
        <AuthTab id="session">Session</AuthTab>
        <AuthTab id="oauth">OAuth</AuthTab>
      </TabGroup>
      <Main />
      {/* <MainSwitch> */}
      {/* <Auth id="jwt" title="JWT" />
        <hr />
        <Auth id="simple-token" title="Simple Token Auth" />
        <hr />
        <Auth id="session" title="Session Auth" />
        <hr />
        <OAuth title="OAuth" /> */}
      {/* <hr />
      <Passport /> */}
      {/* <hr /> */}
      {/* </MainSwitch> */}
      <TabGroup placement="bottom">
        <LoginTab action={Actions.LOGIN}>Log In</LoginTab>
        <LoginTab action={Actions.SIGN_UP}>Sign Up</LoginTab>
      </TabGroup>
    </Login>
  );
}
