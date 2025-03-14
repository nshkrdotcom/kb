// frontend/src/components/notifications/NotificationSystem.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RootState } from '../../store/store';
import { removeNotification } from '../../store/slices/notification-slice';

const NotificationSystem: React.FC = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.notifications.items);
  
  useEffect(() => {
    // Show new notifications
    notifications.forEach(notification => {
      if (!notification.displayed) {
        // Convert notification type to toast type
        const toastType = notification.type === 'error' ? toast.error :
                         notification.type === 'success' ? toast.success :
                         notification.type === 'warning' ? toast.warning :
                         toast.info;
        
        // Display toast
        toastType(notification.message, {
          position: 'top-right',
          autoClose: notification.type === 'error' ? 8000 : 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          onClose: () => dispatch(removeNotification(notification.id))
        });
        
        // Mark as displayed
        dispatch({ 
          type: 'notifications/markAsDisplayed', 
          payload: notification.id 
        });
      }
    });
  }, [notifications, dispatch]);
  
  return <ToastContainer />;
};

export default NotificationSystem;