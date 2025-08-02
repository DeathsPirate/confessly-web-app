const { dbHelpers } = require('./database');

// AI Assistant that responds to confessions with advice
class AIAssistant {
  constructor() {
    this.name = "Confessor Bot";
    this.responseRate = 0.3; // 30% chance to respond to any confession
  }

  // Rule-based responses based on mood and content keywords
  generateResponse(confession) {
    const { content, mood } = confession;
    const contentLower = content.toLowerCase();
    
    // Mood-based responses
    const moodResponses = {
      'guilty': [
        "Remember, everyone makes mistakes. What matters is learning from them and growing as a person. 🌱",
        "Guilt shows you have a conscience, which is actually a good thing. Consider if there's a way to make amends or just be kinder to yourself. 💙",
        "We're all human and imperfect. The fact that you feel guilty means you care about doing better. That's admirable. ✨"
      ],
      'regretful': [
        "Regret can be a teacher if we let it. What lesson is this experience trying to teach you? 🎓",
        "The past can't be changed, but the future is full of possibilities. Focus on what you can control moving forward. 🌅",
        "Sometimes our biggest regrets lead to our most important life changes. This could be a turning point. 🔄"
      ],
      'anxious': [
        "Anxiety often comes from worrying about things outside our control. Try focusing on what you can actually influence today. 🧘‍♀️",
        "Take a deep breath. Most of what we worry about never actually happens. You're stronger than you think. 💪",
        "It's okay to feel anxious - it means you care. But don't let it paralyze you from taking positive action. 🌟"
      ],
      'frustrated': [
        "Frustration often signals that something needs to change. What's one small step you could take today? 🚶‍♀️",
        "Channel that frustration into fuel for positive change. Some of the best innovations come from frustration! 🚀",
        "It's natural to feel frustrated sometimes. Consider if this situation is worth your energy or if it's time to let go. 🍃"
      ],
      'embarrassed': [
        "Embarrassing moments make the best stories later! We've all been there, and people forget faster than you think. 😊",
        "What feels mortifying today will likely be something you laugh about in the future. Be gentle with yourself. 🤗",
        "Everyone has embarrassing moments - it's part of being human. It shows you're living life and taking chances! 🎭"
      ],
      'hopeful': [
        "I love your optimism! Hope is like a muscle - the more you use it, the stronger it gets. Keep nurturing that feeling. 🌈",
        "Hope is one of the most powerful forces in the universe. Hold onto that feeling and let it guide your actions. ⭐",
        "Your hope is inspiring! Remember to take concrete steps toward what you're hoping for. Dreams need action too. 🏃‍♀️"
      ],
      'confused': [
        "Confusion is often the first step toward clarity. Sometimes we need to sit with uncertainty before the path becomes clear. 🧭",
        "When confused, try writing down what you know for sure vs. what you're uncertain about. It can help organize your thoughts. 📝",
        "It's okay not to have all the answers. Sometimes the best decisions come from following your intuition. 💫"
      ],
      'proud': [
        "Celebrate your wins, big and small! Taking a moment to acknowledge your achievements is important for motivation. 🎉",
        "Pride in your accomplishments is healthy and deserved. Use this feeling to fuel your next challenge! 🏆",
        "It sounds like you've worked hard for this. Enjoy the moment - you've earned it! 🌟"
      ],
      'ashamed': [
        "Shame is heavy, but it doesn't define you. Consider talking to someone you trust about these feelings. 🤝",
        "We all have parts of ourselves we're not proud of. The key is learning and growing from these experiences. 🌱",
        "Shame thrives in secrecy but withers in the light of understanding. You're brave for acknowledging these feelings. 💙"
      ],
      'relieved': [
        "What a wonderful feeling! Take a moment to really savor this relief - you've been through something difficult. 😌",
        "Relief often comes after we face our fears or resolve something challenging. You should be proud of getting through it. 🌅",
        "Isn't it amazing how much lighter we feel when a burden is lifted? Carry this feeling with you. ☀️"
      ]
    };

    // Content-based responses for specific themes
    const themeResponses = {
      food: [
        "Food brings people together and makes life more enjoyable. There's no shame in having food preferences! 🍕",
        "Life's too short not to enjoy good food. We all have our guilty pleasures! 😋"
      ],
      work: [
        "Work is just one part of life. Remember to maintain balance and don't let it consume your identity. ⚖️",
        "Career challenges are growth opportunities in disguise. What skill could you develop from this situation? 📈"
      ],
      relationships: [
        "Relationships are complicated because people are complicated. Communication and empathy go a long way. 💕",
        "Every relationship teaches us something about ourselves. What is this situation trying to teach you? 🪞"
      ],
      family: [
        "Family dynamics can be challenging. Remember, you can love someone and still set healthy boundaries. 👨‍👩‍👧‍👦",
        "We don't choose our family, but we can choose how we respond to them. Focus on what you can control. 🏠"
      ],
      money: [
        "Money is a tool, not a measure of your worth. Focus on your values and what truly brings you fulfillment. 💰",
        "Financial stress is real, but remember that your situation can change. Take it one step at a time. 📊"
      ],
      health: [
        "Your health is your wealth. Small, consistent steps often lead to big improvements over time. 🏃‍♀️",
        "Be patient with yourself. Healing and change take time, but every positive choice matters. 🌿"
      ]
    };

    // Determine theme based on content
    let theme = null;
    if (/(food|eat|pizza|snack|cook|meal|hungry)/i.test(contentLower)) theme = 'food';
    else if (/(work|job|boss|career|office|interview)/i.test(contentLower)) theme = 'work';
    else if (/(relationship|partner|boyfriend|girlfriend|dating|love)/i.test(contentLower)) theme = 'relationships';
    else if (/(family|mom|dad|parent|sibling|brother|sister)/i.test(contentLower)) theme = 'family';
    else if (/(money|financial|debt|expensive|poor|rich)/i.test(contentLower)) theme = 'money';
    else if (/(health|sick|doctor|medical|exercise|fitness)/i.test(contentLower)) theme = 'health';

    // Choose response source
    let responses = [];
    
    if (mood && moodResponses[mood.toLowerCase()]) {
      responses = moodResponses[mood.toLowerCase()];
    } else if (theme && themeResponses[theme]) {
      responses = [...themeResponses[theme]];
    } else {
      // Generic supportive responses
      responses = [
        "Thank you for sharing. It takes courage to be vulnerable, even anonymously. 🤗",
        "Everyone's journey is different. Be patient with yourself as you navigate this. 🌸",
        "Sometimes just expressing our thoughts helps us process them. How are you feeling now? 💭",
        "You're not alone in feeling this way. Many people have similar experiences. 🤝",
        "Life is full of ups and downs. This too shall pass, and you'll grow stronger from it. 🌈",
        "Consider talking to someone you trust about this. Sometimes an outside perspective helps. 👥",
        "What would you tell a friend going through the same thing? Often we're kinder to others than ourselves. 💙",
        "Small steps forward are still progress. Celebrate the little victories along the way. 🎯"
      ];
    }

    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Check if AI should respond to this confession
  shouldRespond(confession) {
    // Always respond to certain moods
    const priorityMoods = ['anxious', 'ashamed', 'frustrated', 'confused'];
    if (confession.mood && priorityMoods.includes(confession.mood.toLowerCase())) {
      return true;
    }

    // Random chance for other confessions
    return Math.random() < this.responseRate;
  }

  // Main method to process a confession and potentially respond
  async processConfession(confession) {
    try {
      if (!this.shouldRespond(confession)) {
        return null;
      }

      const response = this.generateResponse(confession);
      
      // Create AI response as a comment
      const aiComment = await dbHelpers.createComment(
        999999, // Special AI user ID
        confession.id,
        response
      );

      console.log(`AI Assistant responded to confession ${confession.id}`);
      return aiComment;
    } catch (error) {
      console.error('AI Assistant error:', error);
      return null;
    }
  }

  // Process multiple confessions (for batch processing)
  async processConfessions(confessions) {
    const responses = [];
    for (const confession of confessions) {
      const response = await this.processConfession(confession);
      if (response) {
        responses.push(response);
      }
    }
    return responses;
  }

  // Advanced AI integration placeholder (for future OpenAI/Claude integration)
  async generateAIResponse(confession, aiService = null) {
    if (aiService === 'openai') {
      // Placeholder for OpenAI integration
      // const response = await openai.createCompletion({
      //   model: "gpt-3.5-turbo",
      //   messages: [{
      //     role: "system",
      //     content: "You are a supportive AI assistant responding to anonymous confessions. Provide empathetic, helpful advice in 1-2 sentences."
      //   }, {
      //     role: "user", 
      //     content: confession.content
      //   }],
      //   max_tokens: 100
      // });
      // return response.data.choices[0].message.content;
    }
    
    // Fall back to rule-based system
    return this.generateResponse(confession);
  }
}

module.exports = new AIAssistant();