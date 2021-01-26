/* eslint-disable react/jsx-filename-extension */
/* eslint-disable jsx-quotes */
/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line object-curly-newline
import { ErrorMessage, FormButton, Notify } from './SharedStyles';

const Deactivate = ({ history, currentUser, currentEmail }) => {
  const [notify, setNotify] = useState('');
  const [error, setError] = useState('');

  const onReset = async (ev) => {
    ev.preventDefault();
    // Only proceed if there are no errors
    if (error !== '') return;
    const data = {
      username: currentUser,
      email: currentEmail,
    };
    // eslint-disable-next-line no-undef
    const res = await fetch(`/deactivate/${currentUser}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
    });
    if (res.ok) {
      // Notify users
      setNotify(
        // eslint-disable-next-line comma-dangle
        'Account has been successfully deactivated.',
      );
    } else {
      const err = await res.json();
      setError(err.error);
    }
  };

  const onCancel = async (ev) => {
    ev.preventDefault();
    history.goBack();
  };

  const onAcceptReset = () => {
    history.push('/logout');
  };

  return (
    <div style={{ gridArea: 'main' }}>
      {notify !== '' ? (
        <Notify id='notification' msg={notify} onAccept={onAcceptReset} />
      ) : null}
      <ErrorMessage msg={error} />
      <h4 style={{ color: '#dc3545' }}>
        Your account will be deleted permanently.
      </h4>
      <h4 style={{ color: '#dc3545', marginBottom: '30px' }}>
        You won't be able to reactivate your account or retrieve any of the
        information that you've added.
      </h4>
      <div />
      <div>
        <FormButton
          id='submitBtn'
          onClick={onReset}
          style={{ color: 'white', marginRight: '5px' }}
        >
          Confirm Deactivation
        </FormButton>
        <FormButton
          id='cancelBtn'
          onClick={onCancel}
          style={{ color: 'white' }}
        >
          Cancel
        </FormButton>
      </div>
    </div>
  );
};

Deactivate.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  history: PropTypes.object.isRequired,
  currentUser: PropTypes.string.isRequired,
  currentEmail: PropTypes.string.isRequired,
};

export default Deactivate;
