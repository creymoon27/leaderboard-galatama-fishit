exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  };

  const rawUsername = (event.queryStringParameters && event.queryStringParameters.username || "").trim();
  if (!rawUsername) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ found: false, error: "Username kosong" })
    };
  }

  try {
    const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        usernames: [rawUsername],
        excludeBannedUsers: false
      })
    });

    if (!userRes.ok) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ found: false, username: rawUsername, displayName: rawUsername })
      };
    }

    const userData = await userRes.json();
    const u = Array.isArray(userData && userData.data) ? userData.data[0] : null;
    if (!u || !u.id) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ found: false, username: rawUsername, displayName: rawUsername })
      };
    }

    const [headRes, bodyRes] = await Promise.all([
      fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${u.id}&size=150x150&format=Png&isCircular=false`),
      fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${u.id}&size=352x352&format=Png&isCircular=false`)
    ]);

    const headJson = headRes.ok ? await headRes.json() : null;
    const bodyJson = bodyRes.ok ? await bodyRes.json() : null;

    const avatarUrl = (headJson && headJson.data && headJson.data[0] && headJson.data[0].imageUrl) || "";
    const fullBodyUrl = (bodyJson && bodyJson.data && bodyJson.data[0] && bodyJson.data[0].imageUrl) || avatarUrl;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        found: true,
        userId: u.id,
        username: u.name || rawUsername,
        displayName: u.displayName || u.name || rawUsername,
        avatarUrl,
        fullBodyUrl
      })
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        found: false,
        username: rawUsername,
        displayName: rawUsername,
        error: err.message
      })
    };
  }
};