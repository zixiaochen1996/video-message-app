/* eslint-disable react/require-default-props */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-undef */
/* eslint-disable no-plusplus */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable jsx-quotes */
/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable react/jsx-no-duplicate-props */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCog } from '@fortawesome/free-solid-svg-icons';
import {
  ErrorMessage,
  FormBase,
  FormLabel,
  FormInput,
  FormButton,
} from './SharedStyles';

const Card = styled.div`
  padding: 1rem;
  border: #ccc 2px dotted;
  margin: 10px;
`;

const MainView = ({ history, socket, currentUser, image }) => {
  const [contactname, setUser] = useState('');
  const [error, setError] = useState('');
  const [contacts, setContacts] = useState([]);
  const [suggestions, setSuggestions] = useState(new Set());
  const [clickaddToggle, setClickAddToggle] = useState(0);

  const onSubmit = async (ev) => {
    ev.preventDefault();
    // clear error
    if (error !== '') {
      setError('');
    }
    console.log(contactname);
    // eslint-disable-next-line no-undef
    const res = await fetch(`/addcontact/${currentUser}`, {
      method: 'PUT',
      body: JSON.stringify({ contactname }),
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
    });
    const data = await res.json();
    if (res.ok) {
      // eslint-disable-next-line no-console
      // console.log('new contacts:');
      // eslint-disable-next-line no-console
      // console.log(data.contacts);
      setContacts(data.contacts);
      setUser('');
      history.push(`/home/${currentUser}`);
    } else {
      setError(data.error);
      history.push(`/home/${currentUser}`);
    }
  };

  const onClickAdd = (name) => {
    setUser(name);
    setClickAddToggle(clickaddToggle + 1);
    // onSubmit(new Event('look'));
  };

  const onDeleteContact = async (ev) => {
    ev.preventDefault();
    if (error !== '') {
      setError('');
    }
    // eslint-disable-next-line no-console
    // console.log('toDelete');
    // eslint-disable-next-line no-console
    // console.log(ev.target.value);
    // eslint-disable-next-line no-undef
    const res = await fetch(`/deletecontact/${currentUser}`, {
      method: 'PUT',
      body: JSON.stringify({ contactname: ev.target.value }),
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
    });
    const data = await res.json();
    if (res.ok) {
      // eslint-disable-next-line no-console
      // console.log('new contacts (after delete):');
      // eslint-disable-next-line no-console
      // console.log(data.contacts);
      setContacts(data.contacts);
      history.push(`/home/${currentUser}`);
    } else {
      setError(data.error);
      history.push(`/home/${currentUser}`);
    }
  };

  const onClickContact = async (ev) => {
    ev.preventDefault();
    const contact = ev.target.value;
    if (error !== '') {
      setError('');
    }
    // eslint-disable-next-line no-undef
    let res = await fetch(`/chatroom/${currentUser}/${contact}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
    });
    let data = await res.json();
    if (!res.ok) {
      // eslint-disable-next-line no-undef
      res = await fetch('/chatroom', {
        method: 'POST',
        body: JSON.stringify({ user1: currentUser, user2: contact }),
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
      });
      data = await res.json();
      if (res.ok) {
        history.push(`/chatroom/${data.id}/${currentUser}/${contact}`);
      } else {
        setError(data.error);
        history.push(`/home/${currentUser}`);
      }
    }
    if (res.ok) {
      history.push(`/chatroom/${data.id}/${currentUser}/${contact}`);
    } else {
      setError(data.error);
      history.push(`/home/${currentUser}`);
    }
  };

  useEffect(() => {
    const setSocketID = async (socketID) => {
      await fetch(`/setsocketid/${currentUser}`, {
        method: 'PUT',
        body: JSON.stringify({ socketID }),
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
      });
    };
    if (socket) {
      setSocketID(socket.id);
      socket.on('incoming-call', ({ chatroomId, caller }) => {
        if (caller !== currentUser) {
          console.log('received incoming-call');
          history.push(`/pending/${chatroomId}/${caller}/${currentUser}`);
        }
      });
    }
    return () => {
      setSocketID('');
    };
  }, [currentUser]);
  useEffect(() => {
    const fetchContactsAndSuggestions = async () => {
      const res = await fetch(`/contacts/${currentUser}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
      });
      const data = await res.json();
      setContacts(data.contacts);

      /* Suggestions */
      const noDupNames = new Set();
      const ctNames = new Set();
      data.contacts.forEach((ct) => ctNames.add(ct.contactname));
      data.contacts.forEach(async (ct) => {
        const res2 = await fetch(`/contacts/${ct.contactname}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
        });
        const data2 = await res2.json();
        data2.contacts.forEach((ctct) => {
          const ctctname = ctct.contactname;
          if (
            // eslint-disable-next-line operator-linebreak
            ctctname !== currentUser &&
            // eslint-disable-next-line operator-linebreak
            !ctNames.has(ctctname) &&
            !noDupNames.has(ctctname)
          ) {
            noDupNames.add(ctct.contactname);
            setSuggestions(new Set(suggestions.add(ctct)));
          }
        });
        console.log('updated suggestions');
        console.log(suggestions);
      });
    };

    fetchContactsAndSuggestions();
    console.log('done fetch');
  }, [currentUser]);

  useEffect(() => {
    if (clickaddToggle > 0) {
      onSubmit(new Event('look'));
    }
  }, [clickaddToggle]);

  return (
    <div style={{ gridArea: 'ft', margin: '50px' }}>
      <span>
        <img src={image} alt={currentUser} style={{ borderRadius: '50%' }} />
        <Link
          id='profileLink'
          to={`/profile/${currentUser}`}
          style={{ textDecoration: 'none' }}
        >
          <FontAwesomeIcon icon={faUserCog} /> {currentUser}
        </Link>
      </span>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}
      >
        {Array.from(suggestions).map((each) => (
          <Card key={each.contactname} style={{ textAlign: 'center' }}>
            <img
              src={each.contactimage}
              alt={each.contactimage}
              style={{ borderRadius: '50%' }}
            />
            <h4>Suggested Contact: {each.contactname}</h4>
            <FormButton
              type='submit'
              value={each.contactname}
              onClick={() => onClickAdd(each.contactname)}
              style={{
                marginBottom: '10px',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Add To Contact
            </FormButton>{' '}
          </Card>
        ))}
      </div>
      <ErrorMessage msg={error} />
      <FormBase>
        <FormLabel htmlFor='contactname'>Search New Contact:</FormLabel>
        <FormInput
          id='contactname'
          name='contactname'
          type='text'
          placeholder='Username'
          value={contactname}
          onChange={(ev) => setUser(ev.target.value.toLowerCase())}
        />
        <div />
        <FormButton
          id='submitBtn'
          onClick={onSubmit}
          style={{ color: 'white', cursor: 'pointer' }}
        >
          Add Contact
        </FormButton>
      </FormBase>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}
      >
        {contacts.map((each) => (
          <Card key={each.contactname} style={{ textAlign: 'center' }}>
            <img
              src={each.contactimage}
              alt={each.contactname}
              style={{ borderRadius: '50%' }}
            />
            <h4>Username: {each.contactname}</h4>
            <FormButton
              type='submit'
              value={each.contactname}
              onClick={onClickContact}
              style={{
                marginBottom: '10px',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Messaging View
            </FormButton>{' '}
            {/* <FormButton
              type='submit'
              value={each.contactname}
              // onClick={onClickContact}
              style={{
                marginBottom: '10px',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Make Voice Call [Milestone5]
            </FormButton>{' '} */}
            <FormButton
              type='submit'
              value={each.contactname}
              className='deleteContactBtn'
              style={{ marginLeft: 'auto' }}
              onClick={onDeleteContact}
              style={{ color: 'white', cursor: 'pointer' }}
            >
              Delete Contact
            </FormButton>
          </Card>
        ))}
      </div>
    </div>
  );
};

MainView.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  history: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  socket: PropTypes.object,
  currentUser: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
};

export default MainView;
