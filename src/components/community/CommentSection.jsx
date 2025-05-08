
// src/components/community/CommentSection.js
import React from 'react';
import CommentItem from './CommentItem';

const CommentSection = ({ 
  comments, 
  newComment, 
  setNewComment, 
  handleSubmitComment 
}) => {
  return (
    <div className="comments-section">
      <h3>Comentários</h3>
      
      <div className="comment-input">
        <textarea
          placeholder="Adicione um comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        ></textarea>
        <button 
          className="comment-submit"
          onClick={handleSubmitComment}
          disabled={!newComment.trim()}
        >
          Enviar
        </button>
      </div>
      
      {comments.length === 0 ? (
        <div className="no-comments">
          <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
        </div>
      ) : (
        <div className="comments-list">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
