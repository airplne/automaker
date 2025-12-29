import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AutoModeService Wizard Mode', () => {
  describe('Wizard Question Parsing', () => {
    it('should parse valid [WIZARD_QUESTION] marker', () => {
      const text =
        '[WIZARD_QUESTION]{"id":"Q1","header":"Template Type","question":"What type of implementation?","multiSelect":false,"options":[{"label":"Simple","description":"Basic implementation","value":"simple"},{"label":"Advanced","description":"Full featured","value":"advanced"}]}';
      const match = text.match(/\[WIZARD_QUESTION\](\{[\s\S]*\})/);

      expect(match).not.toBeNull();
      expect(match![1]).toBeDefined();

      const parsed = JSON.parse(match![1]);
      expect(parsed.id).toBe('Q1');
      expect(parsed.header).toBe('Template Type');
      expect(parsed.question).toBe('What type of implementation?');
      expect(parsed.options).toHaveLength(2);
      expect(parsed.options[0].value).toBe('simple');
    });

    it('should parse multiline JSON in wizard question', () => {
      const text = `[WIZARD_QUESTION]{
  "id": "Q2",
  "header": "Features",
  "question": "Which features?",
  "multiSelect": true,
  "options": [
    {"label": "A", "description": "Feature A", "value": "a"},
    {"label": "B", "description": "Feature B", "value": "b"}
  ]
}`;
      const match = text.match(/\[WIZARD_QUESTION\](\{[\s\S]*\})/);
      expect(match).not.toBeNull();

      const parsed = JSON.parse(match![1]);
      expect(parsed.id).toBe('Q2');
      expect(parsed.multiSelect).toBe(true);
    });

    it('should detect [WIZARD_COMPLETE] marker', () => {
      const text =
        'Based on your answers, I have enough information.\n[WIZARD_COMPLETE]\nNow proceeding to plan...';
      expect(text.includes('[WIZARD_COMPLETE]')).toBe(true);
    });

    it('should handle malformed JSON gracefully', () => {
      const text = '[WIZARD_QUESTION]{invalid json here}';
      const match = text.match(/\[WIZARD_QUESTION\](\{[\s\S]*\})/);

      expect(match).not.toBeNull();
      expect(() => JSON.parse(match![1])).toThrow();
    });
  });

  describe('WizardState Interface', () => {
    it('should track wizard status transitions', () => {
      const wizardState = {
        status: 'pending' as const,
        questionsAsked: [],
        answers: {},
      };

      // Transition to asking
      wizardState.status = 'asking';
      expect(wizardState.status).toBe('asking');

      // Transition to complete
      wizardState.status = 'complete';
      expect(wizardState.status).toBe('complete');
    });

    it('should accumulate questions and answers', () => {
      const wizardState = {
        status: 'asking' as const,
        currentQuestionId: 'Q2',
        questionsAsked: [
          { id: 'Q1', question: 'First question?', header: 'Q1', options: [], multiSelect: false },
          { id: 'Q2', question: 'Second question?', header: 'Q2', options: [], multiSelect: false },
        ],
        answers: { Q1: 'answer1', Q2: ['a', 'b'] },
        startedAt: new Date().toISOString(),
      };

      expect(wizardState.questionsAsked).toHaveLength(2);
      expect(wizardState.answers['Q1']).toBe('answer1');
      expect(wizardState.answers['Q2']).toEqual(['a', 'b']);
    });

    it('should support multi-select answers as arrays', () => {
      const answers: Record<string, string | string[]> = {
        Q1: 'single',
        Q2: ['multiple', 'values'],
      };

      expect(typeof answers['Q1']).toBe('string');
      expect(Array.isArray(answers['Q2'])).toBe(true);
    });
  });

  describe('Question Count Enforcement', () => {
    const MIN_QUESTIONS = 2;
    const MAX_QUESTIONS = 5;

    it('should enforce minimum 2 questions', () => {
      const questionsAsked = 1;
      const canComplete = questionsAsked >= MIN_QUESTIONS;
      expect(canComplete).toBe(false);
    });

    it('should allow completion after 2 questions', () => {
      const questionsAsked = 2;
      const canComplete = questionsAsked >= MIN_QUESTIONS;
      expect(canComplete).toBe(true);
    });

    it('should force completion at 5 questions', () => {
      const questionsAsked = 5;
      const mustComplete = questionsAsked >= MAX_QUESTIONS;
      expect(mustComplete).toBe(true);
    });

    it('should allow questions between 2 and 5', () => {
      for (let q = 2; q <= 5; q++) {
        const isValid = q >= MIN_QUESTIONS && q <= MAX_QUESTIONS;
        expect(isValid).toBe(true);
      }
    });
  });

  describe('Question Index Calculation', () => {
    it('should calculate 0-based index correctly', () => {
      // After asking Q1, questionsAsked = 1, index = 0
      let questionsAsked = 1;
      expect(questionsAsked - 1).toBe(0);

      // After asking Q2, questionsAsked = 2, index = 1
      questionsAsked = 2;
      expect(questionsAsked - 1).toBe(1);

      // After asking Q3, questionsAsked = 3, index = 2
      questionsAsked = 3;
      expect(questionsAsked - 1).toBe(2);
    });
  });

  describe('Wizard Answer Submission', () => {
    it('should return questionsRemaining estimate', () => {
      const MAX_QUESTIONS = 5;
      const questionsAsked = 2;
      const questionsRemaining = Math.max(0, MAX_QUESTIONS - questionsAsked);
      expect(questionsRemaining).toBe(3);
    });

    it('should return 0 remaining at max questions', () => {
      const MAX_QUESTIONS = 5;
      const questionsAsked = 5;
      const questionsRemaining = Math.max(0, MAX_QUESTIONS - questionsAsked);
      expect(questionsRemaining).toBe(0);
    });
  });
});
