const silenceLogsMatching =
  (string) =>
  (log) =>
  (...logArgs) => {
    if (new RegExp(string).test(...logArgs)) {
      return;
    }
    log(...logArgs);
  };

const logRegEx =
  /(Auth Server listening)|(Static server listening)|(isLoggedIn)/;
console.log = silenceLogsMatching(logRegEx)(console.log);
console.error = silenceLogsMatching('Error verifying token')(console.error);
