/* eslint-disable react/jsx-filename-extension */
/* eslint-disable jsx-quotes */
/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable operator-linebreak */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Carousel from 'react-material-ui-carousel';
import {
  ErrorMessage,
  FormBase,
  FormLabel,
  FormInput,
  FormButton,
} from './SharedStyles';

const Card = styled.div`
  padding: 0.5rem;
  border: #ccc 2px dotted;
  margin: 2px;
`;

const StatusView = ({ currentUser }) => {
  const [status, setStatus] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [error, setError] = useState('');
  const [change, setChange] = useState(false);

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (error !== '') {
      setError('');
    }
    if (status === '') {
      setError('Please enter something');
      return;
    }
    let gifImage;
    try {
      // eslint-disable-next-line no-undef
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=E0JCPQXnMrbL8e4R1yX51HEAsZojsHz0&q=${status}&limit=10&rating=g`,
      );
      const json = await response.json();
      const random = Math.floor(Math.random() * 10);
      if (json.data.length !== 0 && json.data[random] !== undefined) {
        gifImage = json.data[random].images.downsized.url;
      }
      const data = {
        status,
        gifImage,
      };
      // eslint-disable-next-line no-undef
      await fetch(`/addstatus/${currentUser}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
      });
      setStatus('');
      setChange(!change);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    const fetchStatuses = async () => {
      // eslint-disable-next-line no-undef
      const res = await fetch(`/statuses/${currentUser}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
      });
      const data = await res.json();
      setStatuses(data.statuses);
    };
    fetchStatuses();
  }, [change, currentUser]);

  return (
    <div style={{ gridArea: 'ft', margin: '0 50px' }}>
      <ErrorMessage msg={error} />
      <FormBase>
        <FormLabel htmlFor='status'>New Status:</FormLabel>
        <FormInput
          id='status'
          name='status'
          type='text'
          placeholder='Type something ~ (i.e., happy, sad, tired)'
          value={status}
          onChange={(ev) => {
            setStatus(ev.target.value.toLowerCase());
          }}
        />
        <div />
        <FormButton
          id='submitBtn'
          onClick={onSubmit}
          style={{ color: 'white', cursor: 'pointer' }}
        >
          Post Status
        </FormButton>
      </FormBase>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
        }}
      >
        <Carousel>
          {statuses
            .filter((each) => each.user !== undefined)
            .map((each) => (
              <Card
                key={Math.floor(Math.random() * Math.floor(10000000000))}
                style={{ textAlign: 'center' }}
              >
                <div>
                  <img
                    src={each.userImage}
                    alt=''
                    style={{ borderRadius: '50%', width: '30px' }}
                  />{' '}
                  <em style={{ color: 'darkblue', fontSize: '1.5em' }}>
                    {each.user}
                  </em>
                  : {each.status}
                </div>
                <img
                  src={each.gifImage}
                  alt=''
                  style={{
                    margin: '10px 0',
                    width: '20%',
                    borderRadius: '30%',
                  }}
                />
              </Card>
            ))}
        </Carousel>
      </div>
    </div>
  );
};

StatusView.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  currentUser: PropTypes.string.isRequired,
};

export default StatusView;
