import React, { useState } from "react";
import { Modal, Input, Form, Button } from "antd";

const SettingComp = ({ visible, onClose, onSave }) => {
    const [form] = Form.useForm();

    const handleSave = () => {
        form.validateFields()
            .then(values => {
                console.log("Form Values:", values);
                onSave(values);
                form.resetFields();
                onClose();
            })
            .catch(errorInfo => console.error("Validation Failed:", errorInfo));
    };

    return (
        <Modal
            title="DICOM Settings"
            open={visible}
            onCancel={onClose}
            className="dicom-uploader-modal"
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancel
                </Button>,
                <Button key="save" type="primary" onClick={handleSave}>
                    Save
                </Button>,
            ]}
        >
            <Form form={form} layout="vertical">
                <Form.Item label="IP Address" name="ipAddress" rules={[{ required: true, message: "Please enter IP Address" }]}>
                    <Input placeholder="Enter IP Address" />
                </Form.Item>
                <Form.Item label="DICOM AET" name="dicomAET" rules={[{ required: true, message: "Please enter DICOM AET" }]}>
                    <Input placeholder="Enter DICOM AET" />
                </Form.Item>
                <Form.Item label="PORT" name="port" rules={[{ required: true, message: "Please enter PORT" }]}>
                    <Input placeholder="Enter PORT" />
                </Form.Item>
                <Form.Item label="Folder Location" name="folderLocation" rules={[{ required: true, message: "Please enter Folder Location" }]}>
                    <Input placeholder="Enter Folder Location" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default SettingComp ; 