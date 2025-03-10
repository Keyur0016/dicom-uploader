import React from "react";
import { Form, Input, Button, Card } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import { userLoginRequest } from "../handler/user.handler";
import showNotification from "../handler/notification.handler";
import { FILE_OPERATION_CONSTANT } from "../constant/constant";
import { useNavigate } from "react-router-dom";
import { ROUTES_LIST } from "../constant/route.constant";

const LoginPage = () => {

    const navigation = useNavigate() ; 

    // Login request handler ==========================================
    const {mutateAsync: login, isPending} = useMutation({
        mutationFn: async (payload) => {
            const res = await userLoginRequest({payload}) ; 
            if (res?.status){
                window.electronAPI.saveTokenInfo({
                    "token": res?.data
                })
                window.electronAPI.saveSuccess((event, message) => {
                    if (message == FILE_OPERATION_CONSTANT.TOKEN_FILE_SAVED){
                        showNotification("success", "Login", "Login Successfully") ; 
                        navigation(ROUTES_LIST.STUDYLIST_ROUTE)
                    }
                });
                
                window.electronAPI.saveFailed((event, message) => {
                    showNotification("error", "Error message", message)
                })
                
            }   else {
                showNotification("error", "Login", res?.message) ; 
            }
            return res ; 
        }, 
    })
    
    const onFinish = async (values) => {
        await login({
            username: values.username, 
            password: values.password
        })
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f0f2f5" }}>
            <Card 
                style={{ 
                    width: 350, padding: 20, boxShadow: "0 4px 8px rgba(0,0,0,0.1)", borderRadius: 10 
                }}
                className="login-div"
            >

                <h2 style={{ textAlign: "center", marginBottom: 20 }}>Cloudimts</h2>

                <Form name="loginForm" onFinish={onFinish} layout="vertical">
                    
                    {/* Username input  */}
                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[{ required: true, message: "Please enter your username!" }]}>
                        <Input placeholder="Enter your username" />
                    </Form.Item>

                    {/* Password input  */}
                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: "Please enter your password!" }]}>
                        <Input.Password placeholder="Enter your password" />
                    </Form.Item>

                    {/* Login Button  */}
                    <Form.Item style={{marginTop: "15px"}}>
                        <Button type="primary" htmlType="submit" block loading = {isPending}>
                            Login
                        </Button>
                    </Form.Item>

                </Form>

            </Card>
        </div>
    );
};

export default LoginPage;
