import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import '../../../styles/QuoteCreationForm.css';

const QuoteCreationForm = () => {
    const handleClose = () => {
        // Handle closing the form
        console.log('Closing the form');
    };

    return (
        <div className="quote-form">
            <div className="quote-header">
                <h3>New Quote</h3>
                <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={handleClose} />
            </div>
            {/* Your form content goes here */}
        </div>
    );
};

export default QuoteCreationForm;
