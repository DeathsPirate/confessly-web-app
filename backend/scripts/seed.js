const { initializeDatabase, dbHelpers } = require('../database');
const aiAssistant = require('../aiAssistant');

async function seedDatabase() {
  console.log('Seeding database...');

  try {
    await initializeDatabase();

    // Create test users
    const users = [
      {
        email: 'alice@example.com',
        password: 'password123',
        handle: 'alice_wonder',
        bio: 'Just a curious soul exploring life.',
        favoriteSnack: 'Chocolate cookies'
      },
      {
        email: 'bob@example.com',
        password: 'password123',
        handle: 'bob_builder',
        bio: 'Can we fix it? Yes we can!',
        favoriteSnack: 'Pizza slices'
      },
      {
        email: 'charlie@example.com',
        password: 'password123',
        handle: 'charlie_brown',
        bio: 'Good grief, life is complicated.',
        favoriteSnack: 'Peanuts'
      },
      {
        email: 'diana@example.com',
        password: 'password123',
        handle: 'wonder_diana',
        bio: 'Fighting for truth and justice.',
        favoriteSnack: 'Greek yogurt'
      },
      {
        email: 'moderator@example.com',
        password: 'password123',
        handle: 'mod_supreme',
        bio: 'Keeping the peace in Confessly.',
        favoriteSnack: 'Energy bars'
      }
    ];

    console.log('Creating users...');
    const createdUsers = [];
    for (const userData of users) {
      try {
        const user = await dbHelpers.createUser(
          userData.email,
          userData.password,
          userData.handle,
          userData.bio,
          userData.favoriteSnack
        );
        createdUsers.push(user);
        console.log(`Created user: ${user.handle}`);
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          console.log(`User ${userData.handle} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Give the moderator enough karma
    console.log('Setting up moderator karma...');
    await dbHelpers.updateUserKarma(5, 150); // User ID 5 should be the moderator

    // Create sample confessions
    const confessions = [
      {
        userId: 1,
        content: "I secretly love pineapple on pizza and I'm tired of pretending I don't.",
        mood: "Guilty",
        location: "Kitchen",
        taggedUsers: "@pizza_lovers"
      },
      {
        userId: 2,
        content: "I once built a sandcastle so impressive that I took credit for my 5-year-old nephew's work.",
        mood: "Regretful",
        location: "Beach",
        taggedUsers: ""
      },
      {
        userId: 3,
        content: "I talk to my plants and I genuinely believe they understand me. Sometimes I ask them for life advice.",
        mood: "Hopeful",
        location: "Garden",
        taggedUsers: "@plant_parents"
      },
      {
        userId: 4,
        content: "I've been wearing the same 'lucky' socks to every job interview for the past 3 years. They're falling apart but I can't stop.",
        mood: "Anxious",
        location: "Closet",
        taggedUsers: ""
      },
      {
        userId: 1,
        content: "I judge people based on how they load the dishwasher. There's a right way and a wrong way, and most people are wrong.",
        mood: "Frustrated",
        location: "Kitchen",
        taggedUsers: "@clean_freaks"
      },
      {
        userId: 2,
        content: "I pretend to understand wine when I'm at fancy restaurants, but honestly, it all tastes like grape juice to me.",
        mood: "Embarrassed",
        location: "Restaurant",
        taggedUsers: ""
      },
      {
        userId: 3,
        content: "I've been learning Spanish for 5 years using an app, but I still can't order food in Spanish without pointing at the menu.",
        mood: "Frustrated",
        location: "Language App",
        taggedUsers: "@language_learners"
      },
      {
        userId: 4,
        content: "I have a playlist called 'Songs I'd Never Admit I Like' and it's longer than my public playlists.",
        mood: "Guilty",
        location: "Spotify",
        taggedUsers: "@music_lovers"
      }
    ];

    console.log('Creating confessions...');
    const createdConfessions = [];
    for (const confessionData of confessions) {
      const confession = await dbHelpers.createConfession(
        confessionData.userId,
        confessionData.content,
        confessionData.mood,
        confessionData.location,
        confessionData.taggedUsers
      );
      createdConfessions.push(confession);
      console.log(`Created confession: ${confession.content.substring(0, 50)}...`);
    }

    // Create some votes to give users karma
    console.log('Creating sample votes...');
    const votes = [
      { userId: 2, confessionId: 1, voteType: 'upvote' },
      { userId: 3, confessionId: 1, voteType: 'upvote' },
      { userId: 4, confessionId: 1, voteType: 'upvote' },
      { userId: 1, confessionId: 2, voteType: 'upvote' },
      { userId: 3, confessionId: 2, voteType: 'upvote' },
      { userId: 1, confessionId: 3, voteType: 'upvote' },
      { userId: 2, confessionId: 3, voteType: 'upvote' },
      { userId: 4, confessionId: 3, voteType: 'upvote' },
      { userId: 1, confessionId: 4, voteType: 'downvote' },
      { userId: 2, confessionId: 5, voteType: 'upvote' },
      { userId: 3, confessionId: 6, voteType: 'upvote' },
      { userId: 4, confessionId: 7, voteType: 'upvote' },
      { userId: 1, confessionId: 8, voteType: 'upvote' }
    ];

    for (const vote of votes) {
      try {
        await dbHelpers.castVote(vote.userId, vote.confessionId, vote.voteType);
        
        // Update user karma
        const confession = await dbHelpers.getConfessionById(vote.confessionId);
        const karmaChange = vote.voteType === 'upvote' ? 1 : -1;
        await dbHelpers.updateUserKarma(confession.user_id, karmaChange);
      } catch (error) {
        console.log('Vote creation error (might be duplicate):', error.message);
      }
    }

    // Create some comments
    console.log('Creating sample comments...');
    const comments = [
      { userId: 2, confessionId: 1, content: "Finally someone said it! Pineapple pizza is amazing!" },
      { userId: 3, confessionId: 1, content: "I'm with you on this one. Sweet and salty perfection." },
      { userId: 4, confessionId: 3, content: "My plants are better listeners than most humans." },
      { userId: 1, confessionId: 4, content: "Lucky socks are real! Don't let anyone tell you otherwise." },
      { userId: 2, confessionId: 8, content: "We all have guilty pleasure songs. Nothing wrong with that!" }
    ];

    for (const comment of comments) {
      await dbHelpers.createComment(comment.userId, comment.confessionId, comment.content);
      console.log(`Created comment on confession ${comment.confessionId}`);
    }

    // Create AI assistant responses
    console.log('Creating AI assistant responses...');
    for (const confession of createdConfessions) {
      const fullConfession = {
        id: confession.id,
        content: confession.content,
        mood: confession.mood || '',
        location: confession.location || '',
        tagged_users: confession.taggedUsers || ''
      };
      
      // Force AI to respond to some confessions for demo
      if (confession.id <= 4) { // First 4 confessions get AI responses
        try {
          await aiAssistant.processConfession(fullConfession);
          console.log(`AI responded to confession ${confession.id}`);
        } catch (error) {
          console.log(`AI response failed for confession ${confession.id}:`, error.message);
        }
      }
    }

    console.log('Database seeded successfully!');
    console.log('\nTest user credentials:');
    console.log('Email: alice@example.com, Password: password123, Handle: alice_wonder');
    console.log('Email: bob@example.com, Password: password123, Handle: bob_builder');
    console.log('Email: charlie@example.com, Password: password123, Handle: charlie_brown');
    console.log('Email: diana@example.com, Password: password123, Handle: wonder_diana');
    console.log('Email: moderator@example.com, Password: password123, Handle: mod_supreme (MODERATOR)');

  } catch (error) {
    console.error('Seeding error:', error);
  }

  process.exit(0);
}

seedDatabase();