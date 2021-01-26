/* eslint-disable react/jsx-filename-extension */
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const Logout = ({ history, logOut }) => {
  useEffect(() => {
    logOut();
    history.push('/login');
  }, []);
  return <></>;
};

Logout.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  history: PropTypes.object.isRequired,
  logOut: PropTypes.func.isRequired,
};

export default Logout;
