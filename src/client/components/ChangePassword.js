/* eslint-disable react/jsx-filename-extension */
/* eslint-disable jsx-quotes */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ErrorMessage,
  FormBase,
  FormLabel,
  FormInput,
  FormButton,
  Notify,
} from './SharedStyles';

const ChangePassword = ({ history, currentUser, currentEmail }) => {
  const [state, setState] = useState({
    username: currentUser,
    email: currentEmail,
    password: '',
  });
  const [notify, setNotify] = useState('');
  const [error, setError] = useState('');

  const onChange = (ev) => {
    setError('');
    // Update from form and clear errors
    setState({
      ...state,
      [ev.target.name]: ev.target.value,
    });
  };

  const onReset = async (ev) => {
    ev.preventDefault();
    // Only proceed if there are no errors
    if (error !== '') return;
    const data = {
      username: state.username,
      email: state.email,
      password: state.password,
    };
    // eslint-disable-next-line no-undef
    const res = await fetch('/reset', {
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
        'Password has been successfully reset.',
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
    history.push(`/profile/${state.username}`);
  };

  return (
    <div style={{ gridArea: 'main' }}>
      {notify !== '' ? (
        <Notify id='notification' msg={notify} onAccept={onAcceptReset} />
      ) : null}
      <ErrorMessage msg={error} />
      <FormBase>
        <FormLabel htmlFor='password'>New Password:</FormLabel>
        <FormInput
          id='password'
          name='password'
          type='password'
          placeholder='New Password'
          onChange={onChange}
          value={state.password}
        />
        <div />
        <div>
          <FormButton
            id='submitBtn'
            onClick={onReset}
            style={{ color: 'white', marginRight: '5px' }}
          >
            Change Password
          </FormButton>
          <FormButton
            id='cancelBtn'
            onClick={onCancel}
            style={{ color: 'white' }}
          >
            Cancel
          </FormButton>
        </div>
      </FormBase>
    </div>
  );
};

ChangePassword.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  history: PropTypes.object.isRequired,
  currentUser: PropTypes.string.isRequired,
  currentEmail: PropTypes.string.isRequired,
};

export default ChangePassword;
