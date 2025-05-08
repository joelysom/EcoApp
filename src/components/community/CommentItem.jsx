
// src/components/community/CommentItem.js
import React from 'react';
import { FaRegHeart } from 'react-icons/fa';
import { formatDate } from '../../utils/helpers';

const CommentItem = ({ comment }) => {
  return (
    <div className="comment-item">
      <div className="comment-user">
        <div className="user-avatar small">
          {comment.userAvatar ? (
            <img src={comment.userAvatar} alt={comment.userName} />
          ) : (
            comment.userName?.charAt(0).toUpperCase()
          )}
        </div>
        <div className="comment-user-info">
          <h4>{comment.userName}</h4>
          <p>{formatDate(comment.createdAt)}</p>
        </div>
      </div>
      <p className="comment-text">{comment.text}</p>
      <div className="comment-actions">
        <button className="comment-like">
          <FaRegHeart /> {comment.likes || 0}
        </button>
      </div>
    </div>
  );
};

export default CommentItem;