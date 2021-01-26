/* eslint-disable no-undef */
/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/require-default-props */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable jsx-quotes */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { options, rtc } from './constants';

import {
  FormButton,
} from './SharedStyles';

const Container = styled.div`
  width: 100%;
  height: 100%;
`;

const Half = styled.div`
  float: left;
  width: 50%;
  height: 100vh;
  border: 1px dotted black;
  box-sizing: border-box;
`;

const Card = styled.div`
  padding: 0.01rem;
  border: 1px dotted black;
  margin: 0.5px;
`;

const CallingView = ({ history, socket, currentUser }) => {
  const url = window.location.href.split('/');
  const urlLen = window.location.href.split('/').length;
  const id = url[urlLen - 3];
  const caller = url[urlLen - 2];
  const receiver = url[urlLen - 1];
  const contact = (currentUser === receiver) ? caller : receiver;

  const joinStream = async () => {
    try {
      rtc.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' });
      await rtc.client.join(
        options.appId,
        id,
        options.token,
        null,
      );

      // Create an audio track from the audio captured by a microphone
      rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      // Create a video track from the video captured by a camera
      rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();

      rtc.localVideoTrack.play('local-stream');

      rtc.client.on('user-published', async (user, mediaType) => {
        // Subscribe to a remote user
        await rtc.client.subscribe(user, mediaType);
        console.log('subscribe success');
        // console.log(user);

        if (mediaType === 'video' || mediaType === 'all') {
          // Get `RemoteVideoTrack` in the `user` object.
          const remoteVideoTrack = user.videoTrack;
          console.log(remoteVideoTrack);

          // Dynamically create a container for playing the remote video track.
          const PlayerContainer = React.createElement('div', {
            id: user.uid,
            className: 'stream',
          });
          ReactDOM.render(
            PlayerContainer,
            document.getElementById('remote-stream'),
          );

          user.videoTrack.play(`${user.uid}`);
        }

        if (mediaType === 'audio' || mediaType === 'all') {
          // Get `RemoteAudioTrack` in the `user` object.
          const remoteAudioTrack = user.audioTrack;
          // Play the audio track. Do not need to pass any DOM element
          remoteAudioTrack.play();
        }
      });

      rtc.client.on('user-unpublished', (user) => {
        // Get the dynamically created DIV container
        const playerContainer = document.getElementById(user.uid);
        console.log(playerContainer);
        // Destroy the container
        if (playerContainer) {
          playerContainer.remove();
        }
      });

      // Publish the local audio and video tracks to the channel
      await rtc.client.publish([rtc.localAudioTrack, rtc.localVideoTrack]);

      console.log('publish success!');
    } catch (error) {
      console.error(error);
    }
  };

  const cleanup = async () => {
    const localContainer = document.getElementById('local-stream');
    rtc.localAudioTrack.close();
    rtc.localVideoTrack.close();
    if (localContainer) {
      localContainer.textContent = '';
    }
    // Leave the channel
    await rtc.client.leave();
  };

  const leaveCall = () => {
    history.push(`/chatroom/${id}/${currentUser}/${contact}`);
  };

  useEffect(() => {
    // if (socket) {
    //   socket.on('call-ended', () => {
    //     leaveCall();
    //   });
    // }
    joinStream();

    return async () => {
      // if (socket) {
      //   const res = await fetch(`/getsocketid/${contact}`, {
      //     method: 'GET',
      //     credentials: 'include',
      //     headers: {
      //       'content-type': 'application/json',
      //     },
      //   });
      //   const data = await res.json();
      //   // const { res, data } = getContactSocketID(contact);
      //   console.log(res);
      //   console.log(data);
      //   if (res.ok) {
      //     socket.emit('end-call', {
      //       // chatroomId: id,
      //       socketID: data.socketID,
      //     });
      //   } else {
      //     console.log(`getSocketID failed with error: ${data.error}`);
      //   }
      // }
      cleanup();
    };
  }, [currentUser]);

  const onLeave = (ev) => {
    ev.preventDefault();
    leaveCall();
  };

  return (
    <div style={{ height: '100vh', gridArea: 'ft', margin: '50px' }}>
      <Container>
        <Half>
          <Card key={currentUser} style={{ textAlign: 'center' }}>
            <h4> {currentUser} </h4>
            <FormButton
              type='submit'
              value='leave'
              onClick={onLeave}
              style={{
                marginBottom: '10px',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Leave
            </FormButton>{' '}
          </Card>
          <div id='local-stream' className='stream local-stream' style={{ height: '85.8vh' }} />
        </Half>
        <Half>
          <Card key={contact} style={{ paddingBottom: '2.33rem', textAlign: 'center' }}>
            <h4> {contact} </h4>
          </Card>
          <div id='remote-stream' className='stream remote-stream' style={{ height: '85.8vh' }} />
        </Half>
      </Container>
    </div>
  );
};

CallingView.propTypes = {
  history: PropTypes.object.isRequired,
  socket: PropTypes.object,
  currentUser: PropTypes.string.isRequired,
};

export default CallingView;
