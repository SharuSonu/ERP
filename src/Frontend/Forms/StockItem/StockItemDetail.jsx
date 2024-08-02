// src/StockItemDetail.js
import React, { useState, useEffect } from 'react';
import '../../../styles/StockItemDetail.css';

const StockItemDetail = ({ product }) => {
  return (
    <div className="stock-item-detail">
      <header className="header-section">
        <img src={product.image} alt={product.name} className="product-image" />
        <h1>{product.name}</h1>
      </header>

      <section className="basic-info">
        <h2>Basic Information</h2>
        <p><strong>SKU:</strong> {product.sku}</p>
        <p><strong>Category:</strong> {product.category}</p>
        <p><strong>Brand:</strong> {product.brand}</p>
        <p><strong>Description:</strong> {product.description}</p>
      </section>

      <section className="stock-info">
        <h2>Stock Information</h2>
        <p><strong>Current Stock Level:</strong> {product.currentStock}</p>
        <p><strong>Reorder Level:</strong> {product.reorderLevel}</p>
        <p><strong>Maximum Stock Level:</strong> {product.maxStock}</p>
        <p><strong>Location:</strong> {product.location}</p>
      </section>

      <section className="pricing-info">
        <h2>Pricing Information</h2>
        <p><strong>Cost Price:</strong> ${product.costPrice.toFixed(2)}</p>
        <p><strong>Selling Price:</strong> ${product.sellingPrice.toFixed(2)}</p>
        <p><strong>Discounts:</strong> {product.discounts}</p>
        <p><strong>Tax Details:</strong> {product.taxDetails}</p>
      </section>

      <section className="supplier-info">
        <h2>Supplier Information</h2>
        <p><strong>Supplier Name:</strong> {product.supplierName}</p>
        <p><strong>Contact Details:</strong> {product.contactDetails}</p>
        <p><strong>Last Restocked Date:</strong> {product.lastRestockedDate}</p>
        <p><strong>Next Restock Date:</strong> {product.nextRestockDate}</p>
      </section>

      <section className="audit-info">
        <h2>Audit Information</h2>
        <p><strong>Created Date:</strong> {product.createdDate}</p>
        <p><strong>Last Updated Date:</strong> {product.lastUpdatedDate}</p>
        <p><strong>Added By:</strong> {product.addedBy}</p>
        <p><strong>Updated By:</strong> {product.updatedBy}</p>
      </section>

      <section className="actions">
        <button>Edit</button>
        <button>Delete</button>
        <button>Reorder</button>
        <button>History</button>
      </section>

      <section className="additional-info">
        <h2>Additional Information</h2>
        <p>{product.notes}</p>
        <div className="attachments">
          <label>Attachments:</label>
          <input type="file" />
        </div>
      </section>
    </div>
  );
};

export default StockItemDetail;
