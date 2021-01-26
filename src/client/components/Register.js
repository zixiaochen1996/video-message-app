/* eslint-disable react/jsx-filename-extension */
/* eslint-disable jsx-quotes */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  ErrorMessage,
  FormBase,
  FormLabel,
  FormInput,
  FormButton,
  Notify,
} from './SharedStyles';
import { validPassword, validUsername } from '../../shared';

const Register = ({ history }) => {
  const [state, setState] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [notify, setNotify] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // eslint-disable-next-line no-undef
    document.getElementById('username').focus();
  }, []);

  const onChange = (e) => {
    setError('');
    // Update from form and clear errors
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
    // Make sure the username & the password are valid
    if (e.target.name === 'username') {
      const usernameInvalid = validUsername(e.target.value);
      if (usernameInvalid) setError(`${usernameInvalid.error}`);
    } else if (e.target.name === 'password') {
      const pwdInvalid = validPassword(e.target.value);
      if (pwdInvalid) setError(`${pwdInvalid.error}`);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    // Only proceed if there are no errors
    if (error !== '') return;
    // eslint-disable-next-line no-undef
    const res = await fetch('/user', {
      method: 'POST',
      body: JSON.stringify(state),
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
    });
    if (res.ok) {
      // Notify users
      setNotify(
        // eslint-disable-next-line comma-dangle
        `User '${state.username.toLowerCase()}' registered. Click ok to go to the login page.`,
      );
    } else {
      const err = await res.json();
      setError(err.error);
    }
  };

  const onAcceptRegister = () => {
    history.push('/login');
  };

  return (
    <div style={{ gridArea: 'main' }}>
      {notify !== '' ? (
        <Notify id='notification' msg={notify} onAccept={onAcceptRegister} />
      ) : null}
      <ErrorMessage msg={error} />
      <FormBase>
        <FormLabel htmlFor='username'>Username:</FormLabel>
        <FormInput
          id='username'
          name='username'
          placeholder='Username'
          onChange={onChange}
          value={state.username.toLowerCase()}
        />
        <FormLabel htmlFor='email'>Email:</FormLabel>
        <FormInput
          id='email'
          name='email'
          type='email'
          placeholder='Email Address'
          onChange={onChange}
          value={state.email.toLowerCase()}
        />
        <FormLabel htmlFor='password'>Password:</FormLabel>
        <FormInput
          id='password'
          name='password'
          type='password'
          placeholder='Password'
          onChange={onChange}
          value={state.password}
        />
        <div />
        <FormButton
          id='submitBtn'
          onClick={onSubmit}
          style={{ color: 'white' }}
        >
          Register
        </FormButton>
      </FormBase>
    </div>
  );
};

Register.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  history: PropTypes.object.isRequired,
};

export default Register;
