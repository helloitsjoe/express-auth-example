/* eslint-disable react/prop-types */
import React from 'react';
import { oauth, updateSecureData } from './services';
import { Button, Input, TitleWrap } from './Components';

const OAuth = ({ title }) => {
  const [secureData, setSecureData] = React.useState();
  const [errorMessage, setErrorMessage] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [authToken, setAuthToken] = React.useState();

  const handleOauth = () => {
    setErrorMessage('');
    return oauth()
      .then((token) => {
        setAuthToken(token);
      })
      .catch((err) => {
        setAuthToken(null);
        setErrorMessage(err.message);
      });
  };

  const handleSendSecure = (e) => {
    e.preventDefault();
    setErrorMessage('');
    return updateSecureData(message, authToken)
      .then((res) => {
        setSecureData(res.data.message);
      })
      .catch((err) => {
        setSecureData(null);
        setErrorMessage(err.message);
      });
  };

  return (
    <form onSubmit={handleSendSecure}>
      <TitleWrap>
        <h3 style={{ display: 'inline' }}>{title}</h3>
        {authToken ? (
          <span style={{ color: 'darkseagreen' }}> Logged in</span>
        ) : (
          <span style={{ color: 'gray' }}> Logged out</span>
        )}
      </TitleWrap>
      <div className="column">
        {authToken ? (
          <Button secondary type="button" onClick={() => setAuthToken(null)}>
            Log out
          </Button>
        ) : (
          <Button fullWidth type="button" onClick={handleOauth}>
            Authorize with OAuth
          </Button>
        )}
        <Input
          data-testid="oauth-message-input"
          placeholder="Post a message after you log in"
          onChange={(e) => setMessage(e.target.value)}
          value={message}
        />
        <div>
          <Button fullWidth type="submit">
            Send OAuth message
          </Button>
        </div>
        {secureData && <pre>{secureData}</pre>}
        {errorMessage && <h1 className="error">Error: {errorMessage}</h1>}
      </div>
    </form>
  );
};

export default OAuth;
