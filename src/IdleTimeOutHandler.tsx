import { useEffect, useRef, useState } from "react";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { createWorker } from "./createWorker";

interface IdleTimeOutHandlerProps {
  onActive?: () => void;
  onIdle?: () => void;
  timeOutInterval: number;
  countDownInterval: number;
}
const IdleTimeOutHandler = ({
  onActive: parentActiveHandler = () => { },
  onIdle: parentIdleHandler = () => { },
  timeOutInterval = 5 * 60,
  countDownInterval = 1 * 60
}: IdleTimeOutHandlerProps) => {
  const [isIdle, setIsIdle] = useState(false);
  const [remainingTime, setRemainingTime] = useState();
  const worker = useRef<Worker>();

  const eventHandler = () => {
    localStorage.setItem(
      "lastInteractionTime",
      JSON.stringify(new Date().valueOf())
    );
    worker.current?.postMessage({ key: "userInteracted" });
  };

  useEffect(() => {
    const events = ["click", "scroll", "load", "keydown"];

    events.forEach((eventName) => {
      window.addEventListener(eventName, eventHandler);
    });

    const lastInteractionTimeString = localStorage.getItem("lastInteractionTime");
    const lastInteractionTime = lastInteractionTimeString ? Number(lastInteractionTimeString) : null;

    if (lastInteractionTime === null) {
      localStorage.setItem(
        "lastInteractionTime",
        JSON.stringify(new Date().valueOf())
      );
    }

    worker.current = createWorker('./timer-worker.js');
    worker.current?.postMessage({ key: "timeOutInterval", value: timeOutInterval });
    worker.current?.postMessage({ key: "countDownOutInterval", value: countDownInterval });
    worker.current?.postMessage({ key: "startTimer", value: lastInteractionTime });
    worker.current.onmessage = (e) => {
      if (e.data === 'onActive') {
        setIsIdle(false);
        parentActiveHandler();
      } else if (e.data === 'onIdle') {
        setIsIdle(true);
      } else if (e.data.indexOf('countDown:') > -1) {
        setRemainingTime(e.data.split('countDown:')[1]);
      } else if (e.data === 'countDownCompleted') {
        setIsIdle(false);
        localStorage.removeItem("lastInteractionTime");
        parentIdleHandler();
      } else if (e.data === 'updateLastInteractionTime') {
        const lastInteractionTimeString = localStorage.getItem("lastInteractionTime");
        const lastInteractionTime = lastInteractionTimeString ? Number(lastInteractionTimeString) : null;
        worker.current?.postMessage({ key: "lastInteractionTimeUpdated", value: lastInteractionTime });
      }
      else {
        console.log(e.data);
      }
    }

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, eventHandler);
      });
      worker.current?.terminate();
    };
  }, [timeOutInterval, countDownInterval, parentIdleHandler, parentActiveHandler]);

  return <> {
    isIdle ? <Dialog
      open={true}
      onClose={eventHandler}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Session Timeout
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Due to user inactivity you will be logged out in {remainingTime}.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={eventHandler}>Keep me signed In</Button>
      </DialogActions>
    </Dialog> : null
  }
  </>
};

export default IdleTimeOutHandler;
