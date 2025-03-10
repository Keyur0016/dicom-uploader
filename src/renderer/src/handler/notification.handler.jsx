import { notification } from "antd";

const showNotification = (type, message, description) => {
    notification[type]({
        message: <strong>{message}</strong>,
        description,
        placement: "topRight", // Default position (Change if needed)
        duration: 3, // Auto-close after 3 seconds
        className: "notification-div"
    });
}

export default showNotification ; 