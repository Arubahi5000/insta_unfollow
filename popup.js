// This script is to unfollow accounts on Instagram that do not follow them back.
// It uses the Instagram API to fetch followers and following lists, then unfollows those who are not in the followers list.
// Written by Aryan Bahinipati
// Version 1.0
// Date: 7 Nov 2025

document.getElementById('start').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async () => {
      const delay = ms => new Promise(res => setTimeout(res, ms));
      const csrftoken = document.cookie.split('; ').find(c => c.startsWith('csrftoken=')).split('=')[1];
      const headers = {
        'x-csrftoken': csrftoken,
        'x-ig-app-id': '936619743392459',
        'x-asbd-id': '198387',
        'x-requested-with': 'XMLHttpRequest'
      };

      const getUserId = async (username) => {
        const res = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, { headers });
        const data = await res.json();
        return data?.data?.user?.id;
      };

      const fetchAll = async (urlBase, userId) => {
        let users = [];
        let maxId = null;
        do {
          const url = `${urlBase}${userId}/?count=200${maxId ? `&max_id=${maxId}` : ''}`;
          const res = await fetch(url, { headers, credentials: 'include' });
          const data = await res.json();
          users = users.concat(data.users.map(u => ({ username: u.username, id: u.pk })));
          maxId = data.next_max_id;
          await delay(1000);
        } while (maxId);
        return users;
      };

      const unfollowUser = async (id, username) => {
        const res = await fetch(`https://www.instagram.com/api/v1/friendships/destroy/${id}/`, {
          method: 'POST',
          headers: {
            ...headers,
            'content-type': 'application/x-www-form-urlencoded'
          },
          credentials: 'include'
        });
        return res.ok;
      };

      const username = window.location.pathname.replace(/\//g, '');
      if (!username) return alert('❌ Run this on your profile page');

      const yourId = await getUserId(username);
      const followers = await fetchAll('https://www.instagram.com/api/v1/friendships/', `${yourId}/followers`);
      const followerSet = new Set(followers.map(u => u.username));
      const following = await fetchAll('https://www.instagram.com/api/v1/friendships/', `${yourId}/following`);

      const nonFollowers = following.filter(u => !followerSet.has(u.username));
      let count = 0;

      for (const user of nonFollowers) {
        const ok = await unfollowUser(user.id, user.username);
        if (ok) {
          console.log(`✅ Unfollowed ${user.username}`);
          count++;
        } else {
          console.warn(`❌ Failed to unfollow ${user.username}`);
        }
        await delay(15000);
      }

      alert(`🎉 Done. Unfollowed ${count} users.`);
    }
  });
});

/* Or copy the following code to run in the console of your Instagram profile page:
// This code is intended to be run in the console of your Instagram profile page.
// It will unfollow users who do not follow you back, with a delay to avoid detection.
// Make sure to run this in a browser with the Instagram profile page open.
(async () => {
  const delay = ms => new Promise(res => setTimeout(res, ms));
  const csrftoken = document.cookie.split('; ').find(c => c.startsWith('csrftoken=')).split('=')[1];
  const headers = {
    'x-csrftoken': csrftoken,
    'x-ig-app-id': '936619743392459',
    'x-asbd-id': '198387',
    'x-requested-with': 'XMLHttpRequest'
  };

  const getUserId = async (username) => {
    const res = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, { headers });
    const data = await res.json();
    return data?.data?.user?.id;
  };

  const fetchAll = async (urlBase, userId) => {
    let users = [];
    let maxId = null;
    do {
      const url = `${urlBase}${userId}/?count=200${maxId ? `&max_id=${maxId}` : ''}`;
      const res = await fetch(url, { headers, credentials: 'include' });
      const data = await res.json();
      users = users.concat(data.users.map(u => ({ username: u.username, id: u.pk })));
      maxId = data.next_max_id;
      await delay(1000);
    } while (maxId);
    return users;
  };

  const unfollowUser = async (id, username) => {
    const res = await fetch(`https://www.instagram.com/api/v1/friendships/destroy/${id}/`, {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/x-www-form-urlencoded'
      },
      credentials: 'include'
    });
    return res.ok;
  };

  const username = window.location.pathname.replace(/\//g, '');
  if (!username) {
    console.error('❌ Run this from your Instagram profile page.');
    return;
  }

  const yourId = await getUserId(username);
  if (!yourId) {
    console.error('❌ Could not get your user ID');
    return;
  }

  console.log('📥 Fetching followers...');
  const followers = await fetchAll('https://www.instagram.com/api/v1/friendships/', `${yourId}/followers`);
  const followerSet = new Set(followers.map(u => u.username));
  console.log(`✅ You have ${followers.length} followers.`);

  console.log('📥 Fetching following...');
  const following = await fetchAll('https://www.instagram.com/api/v1/friendships/', `${yourId}/following`);
  console.log(`✅ You are following ${following.length} accounts.`);

  const nonFollowers = following.filter(u => !followerSet.has(u.username));
  console.log(`❌ ${nonFollowers.length} users do not follow you back.`);

  let count = 0;
  for (const user of nonFollowers) {
    const success = await unfollowUser(user.id, user.username);
    if (success) {
      console.log(`✅ Unfollowed ${user.username}`);
      count++;
    } else {
      console.warn(`❌ Failed to unfollow ${user.username}`);
    }
    await delay(15000); // delay to avoid detection
  }

  console.log(`🎉 Done. Unfollowed ${count} users.`);
})();
*/
