import React from 'react';
import { oauth, updateSecureData } from './services';

const OAuth = () => {
  const [oauthData, setOauthData] = React.useState();
  const [errorMessage, setErrorMessage] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleOauth = e => {
    setErrorMessage('');
    return oauth()
      .then(res => {
        setOauthData(res.data.message);
      })
      .catch(err => {
        setOauthData(null);
        setErrorMessage(err.message);
      });
  };

  const handleSendSecure = e => {
    e.preventDefault();
    setErrorMessage('');
    return updateSecureData(message)
      .then(res => {
        setOauthData(res.data.message);
      })
      .catch(err => {
        setOauthData(null);
        setErrorMessage(err.message);
      });
  };

  return (
    <form onSubmit={handleSendSecure}>
      <div className="column">
        <button type="button" onClick={handleOauth}>
          Authorize with OAuth
        </button>
        <input
          placeholder="Post a message after you log in"
          onChange={e => setMessage(e.target.value)}
          value={message}
        />
        <button type="submit">Send message</button>
        {oauthData && <pre>{oauthData}</pre>}
        {errorMessage && <pre>{errorMessage}</pre>}
      </div>
    </form>
  );
};

export default OAuth;
