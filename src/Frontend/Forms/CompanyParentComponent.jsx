import React, { useState, useContext, useEffect } from 'react';
import CompanyEdit from './CompanyEdit';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../Context/AppContext';
import { Form, Input, Select, Button, Checkbox, DatePicker, Upload, message } from 'antd';
import CryptoJS from 'crypto-js';

const CompanyParentComponent = () => {
    const [addresses, setAddresses] = useState([]);
    const [isGSTRegistered, setIsGSTRegistered] = useState(false);
    const [loading, setLoading] = useState(false); // State for loading indicator
    const [logoFileList, setLogoFileList] = useState([]);
    const { companyName } = useContext(AppContext);
    const addAddress = () => {
        setAddresses([...addresses, { key: Date.now() }]);
    };

    const handleLogoFileChange = (info) => {
        let fileList = [...info.fileList];
    
        // Limit the number of uploaded files
        fileList = fileList.slice(-1); // Keep only the last uploaded file
    
        // Update state with the new file list
        setLogoFileList(fileList);
    
        // Optionally, return file list for form submission
        return fileList;
    };

    const removeAddress = (key) => {
        setAddresses(addresses.filter(address => address.key !== key));
    };

    const onFinish = async (values) => {
        console.log('Form values:', values);

        const {
            name,
            industry,
            country,
            state,
            branch,
            currency,
            language,
            timezone,
            financialYear,
            booksFromDate,
            email,
            phone,
            mobile,
            faxNumber,
            website,
            logo,
            isGSTRegistered,
            gstin,
            addresses,
        } = values;

        // Prepare updated organization data
        const updatedOrganization = {
            name,
            industry,
            country,
            state,
            branch,
            currency,
            language,
            timezone,
            financialYear: financialYear ? financialYear.format('YYYY-MM-DD') : null,
            booksFromDate: booksFromDate ? booksFromDate.format('YYYY-MM-DD') : null,
            email,
            phone,
            mobile,
            faxNumber,
            website,
            logo: null,//logoFileList.length > 0 ? logoFileList[0].originFileObj : null,
            isGSTRegistered,
            gstin,
            addresses, // Assuming addresses are already correctly formatted
        };

        setLoading(true);
        try {
            // Make API call to update organization details
            const response = await fetch('http://localhost:5000/api/organization/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // Ensure companyName is defined or fetched correctly
                    'company-name': companyName,
                },
                body: JSON.stringify(updatedOrganization),
            });

            if (response.ok) {
                console.log('Organization updated successfully!');
                
                message.success('Organization Updated successfully!');
                // Optionally, navigate to another page or perform additional actions
                // navigate('/dashboard'); // Uncomment if using navigation
            } else {
                const errorData = await response.json();
                console.error('Error updating organization:', errorData.message);
                // Handle error scenarios, e.g., show error message to user
            }
        } catch (error) {
            console.error('Error updating organization:', error);
            // Handle network errors or other exceptions
        } finally {
            setLoading(false);
        }
    };

    const [fileList, setFileList] = useState([]);

    const handleFileUpload = async ({ file }) => {
        try {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file); // Read file as ArrayBuffer for CryptoJS compatibility
    
            reader.onload = async () => {
                const fileData = reader.result; // ArrayBuffer
                const wordArray = CryptoJS.lib.WordArray.create(fileData); // Convert ArrayBuffer to WordArray
    
                // Encrypt file content
                const encryptedContent = CryptoJS.AES.encrypt(wordArray, 'encryption_secret').toString();
    
                // Prepare FormData for file upload
                const formData = new FormData();
                formData.append('file', file); // Append the actual file
                formData.append('encryptedContent', encryptedContent); // Optionally append encrypted content
                formData.append('fileName', file.name); // File name
                formData.append('fileType', file.type); // File type
    
                // Fetch API to upload file
                const response = await fetch('http://localhost:5000/api/upload', {
                    method: 'POST',
                    headers: {
                        'company-name': companyName, // Replace with actual company name header
                    },
                    body: formData,
                });
    
                if (response.ok) {
                    message.success('File uploaded successfully');
                } else {
                    message.error('Failed to upload file');
                }
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            message.error('Failed to upload file');
        }
    };


    const customUpload = ({ file }) => {
        handleFileUpload({ file });
        
    };

    return (
        <CompanyEdit
            onFinish={onFinish}
            addresses={addresses}
            addAddress={addAddress}
            removeAddress={removeAddress}
            isGSTRegistered={isGSTRegistered}
            setIsGSTRegistered={setIsGSTRegistered}
            customUpload={customUpload}
            handleLogoFileChange={handleLogoFileChange}
            logoFileList={logoFileList}
        />
    );
};

export default CompanyParentComponent;
