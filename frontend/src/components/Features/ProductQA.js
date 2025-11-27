import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Avatar,
  Divider,
  Collapse,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  QuestionAnswer,
  ThumbUp,
  ThumbUpOutlined,
  ExpandMore,
  ExpandLess,
  Send,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { questionService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ProductQA = ({ productId, sellerId }) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [productId]);

  const fetchQuestions = async () => {
    try {
      const response = await questionService.getForProduct(productId);
      setQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return;
    setSubmitting(true);
    try {
      await questionService.ask({ productId, question: newQuestion });
      setNewQuestion('');
      setShowAskForm(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (questionId) => {
    if (!answerText.trim()) return;
    setSubmitting(true);
    try {
      await questionService.answer(questionId, { answer: answerText });
      setAnswerText('');
      setExpandedQuestion(null);
      fetchQuestions();
    } catch (error) {
      console.error('Error answering:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (questionId) => {
    try {
      await questionService.markHelpful(questionId);
      fetchQuestions();
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuestionAnswer color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Questions & Answers ({questions.length})
          </Typography>
        </Box>
        {user && (
          <Button
            variant="outlined"
            onClick={() => setShowAskForm(!showAskForm)}
            startIcon={showAskForm ? <ExpandLess /> : <ExpandMore />}
          >
            Ask a Question
          </Button>
        )}
      </Box>

      <Collapse in={showAskForm}>
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="What would you like to know about this item?"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowAskForm(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAskQuestion}
              disabled={submitting || !newQuestion.trim()}
              startIcon={<Send />}
            >
              Ask
            </Button>
          </Box>
        </Box>
      </Collapse>

      {questions.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No questions yet. Be the first to ask!
        </Typography>
      ) : (
        questions.map((q) => (
          <Box key={q.id} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 14 }}>
                Q
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {q.question}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Asked by {q.asker_username || q.asker?.username} • {formatDistanceToNow(new Date(q.created_at || q.createdAt), { addSuffix: true })}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleMarkHelpful(q.id)}
                    color={q.isHelpful ? 'primary' : 'default'}
                  >
                    {q.isHelpful ? <ThumbUp fontSize="small" /> : <ThumbUpOutlined fontSize="small" />}
                  </IconButton>
                  <Typography variant="caption">{q.helpful_count || q.helpfulCount || 0}</Typography>
                </Box>

                {q.answers?.map((answer) => (
                  <Box key={answer.id} sx={{ display: 'flex', gap: 2, mt: 2, ml: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32, fontSize: 14 }}>
                      A
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{answer.answer}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(answer.is_seller_answer || answer.isSeller) && <Chip label="Seller" size="small" sx={{ mr: 1, height: 18 }} />}
                        {answer.answerer_username || answer.answerer?.username} • {formatDistanceToNow(new Date(answer.created_at || answer.createdAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                  </Box>
                ))}

                {user?.id === sellerId && !q.answers?.length && (
                  <Box sx={{ mt: 2, ml: 2 }}>
                    {expandedQuestion === q.id ? (
                      <Box>
                        <TextField
                          fullWidth
                          size="small"
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Type your answer..."
                          sx={{ mb: 1 }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleAnswer(q.id)}
                          disabled={submitting}
                        >
                          Submit Answer
                        </Button>
                        <Button size="small" onClick={() => setExpandedQuestion(null)} sx={{ ml: 1 }}>
                          Cancel
                        </Button>
                      </Box>
                    ) : (
                      <Button size="small" onClick={() => setExpandedQuestion(q.id)}>
                        Answer this question
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))
      )}
    </Paper>
  );
};

export default ProductQA;
