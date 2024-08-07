import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Modal,Button, Form, Input,message} from 'antd';
import { UserOutlined, LockOutlined, NumberOutlined } from '@ant-design/icons';
import { AppContext } from '../../../Context/AppContext';
import '../../../styles/UserForm.css';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import '../../../styles/UnitForm.css';

const UnitsCreationForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { companyName, setCompanyName } = useContext(AppContext);
  const [formData, setFormData] = useState({
    unitType: 'simple',
    Symbolname: '',
    Formalname: '',
    QUCname: '',
    Decimalnum: '',
    Firstunit: '',
    NumValue: '',
    Secondunit: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedCompanyName = localStorage.getItem('companyName');
    if (storedCompanyName) {
      setCompanyName(storedCompanyName);
    }
        
  }, [companyName]); // Run only once when component mounts


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

 

  const handleSubmitunit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/create-units', {
        ...formData,
        companyName: companyName, // Ensure `companyName` is available in the scope
      });
      console.log('Units added:', response.data);
      message.success('Units added successfully!');
      navigate('/Dashboard');  // Ensure `navigate` is available in the scope
    } catch (error) {
      console.error('Error adding units:', error);
      message.error('Failed to add units. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitcompound = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/create-compoundunits', {
        ...formData,
        companyName: companyName, // Ensure `companyName` is available in the scope
      });
      console.log('Compound units added:', response.data);
      message.success('Compound units added successfully!');
      navigate('/Dashboard'); // Ensure `navigate` is available in the scope
    } catch (error) {
      console.error('Error adding compound units:', error);
      message.error('Failed to add compound units. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="unit-form-container">
      <h1>𝑼𝒏𝒊𝒕𝒔 𝑪𝒓𝒆𝒂𝒕𝒊𝒐𝒏</h1>
      <form className="unit-form">
        <div className="form-group">
          <label htmlFor="unitType">Unit Type:</label>
          <select
            id="unitType"
            name="unitType"
            value={formData.unitType}
            onChange={handleChange}
          >
            <option value="simple">Simple</option>
            <option value="compound">Compound</option>
          </select>
        </div>

        {formData.unitType === 'simple' && (
          <div>
            <div className="form-group">
              <label htmlFor="Symbolname">Symbol Name:</label>
              <input
                type="text"
                id="Symbolname"
                name="Symbolname"
                value={formData.Symbolname}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="Formalname">Formal Name:</label>
              <input
                type="text"
                id="Formalname"
                name="Formalname"
                value={formData.Formalname}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="QUCname">QUC Name:</label>
              <input
                type="text"
                id="QUCname"
                name="QUCname"
                value={formData.QUCname}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="Decimalnum">Decimal Number:</label>
              <input
                type="number"
                id="Decimalnum"
                name="Decimalnum"
                value={formData.Decimalnum}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>
            <button
              type="submit"
              className="submit-button simple-submit-button"
              onClick={handleSubmitunit}
              disabled={loading}
            >
              Submit Simple Unit
            </button>
          </div>
        )}

        {formData.unitType === 'compound' && (
          <div>
            <div className="form-group">
              <label htmlFor="Firstunit">First Unit:</label>
              <input
                type="text"
                id="Firstunit"
                name="Firstunit"
                value={formData.Firstunit}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="NumValue">Number Value:</label>
              <input
                type="text"
                id="NumValue"
                name="NumValue"
                value={formData.NumValue}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="Secondunit">Second Unit:</label>
              <input
                type="text"
                id="Secondunit"
                name="Secondunit"
                value={formData.Secondunit}
                onChange={handleChange}
                required
              />
            </div>
            <button
              type="submit"
              className="submit-button compound-submit-button"
              onClick={handleSubmitcompound}
              disabled={loading}
            >
              Submit Compound Unit
            </button>
          </div>
        )}
      </form>
    </div>
  );
};




export default UnitsCreationForm;
