/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT FOR DIABEET / JEEVANTATVA-DIABO LANDING PAGE
 * ==============================================================================
 * 
 * निर्देश (Instructions):
 * 1. Google Sheets खोलें (जिसमें डेटा सेव करना है)।
 * 2. टॉप मेनू में 'Extensions' (एक्सटेंशन) -> 'Apps Script' पर क्लिक करें।
 * 3. वहां मौजूद पुराना कोड हटाकर यह पूरा कोड पेस्ट करें।
 * 4. ऊपर 'Save' (💾) आइकॉन पर क्लिक करें।
 * 5. टॉप राइट में 'Deploy' बटन दबाएं -> 'New deployment' चुनें।
 * 6. गियर आइकॉन ⚙️ पर क्लिक करके 'Web app' चुनें।
 * 7. सेटिंग्स में:
 *    - Description: "Diabeet Lead Capture"
 *    - Execute as: "Me" (आपकी ईमेल आईडी)
 *    - Who has access: "Anyone" (यह सबसे ज़रूरी है, ताकि वेबसाइट से डेटा आ सके)
 * 8. 'Deploy' पर क्लिक करें और परमिशन Authorize करें ('Advanced' -> 'Go to Untitled project (unsafe)').
 * 9. जो 'Web app URL' मिलेगा (उदा: https://script.google.com/macros/s/..../exec),
 *    उसे कॉपी करके अपनी वेबसाइट के `main.js` में `GOOGLE_SHEET_WEBHOOK_URL` पर डाल दें।
 * ==============================================================================
 */

// CRM Integration Settings (Macherbs Leads API)
var CRM_CONFIG = {
  enabled: true,
  url: 'https://macherbs.com/apileads/leads.php',
  token: 'M6JNcKxcNszQwNYZW',
  channel_id: 'AJ-DBT-SKM',
  product_id: '52'
};

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  // 10 सेकंड तक इंतज़ार करें ताकि एक ही समय पर आने वाली रिक्वेस्ट सुरक्षित रहें
  try {
    lock.waitLock(10000);
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: 'सर्वर व्यस्त है, कृपया कुछ सेकंड बाद पुनः प्रयास करें।'
    });
  }

  try {
    var params = {};

    // 1. GET या POST रिक्वेस्ट से डेटा निकालें
    if (e && e.parameter) {
      params = e.parameter;
    }
    if (e && e.postData && e.postData.contents) {
      try {
        var postJson = JSON.parse(e.postData.contents);
        for (var key in postJson) {
          params[key] = postJson[key];
        }
      } catch (jsonErr) {
        // अगर JSON नहीं है तो e.parameter से काम चलेगा
      }
    }

    var name = (params.name || '').toString().trim();
    var phone = (params.phone || params.cleanPhone || params.number || params.contact || '').toString().trim();
    var formSource = (params.formSource || 'Landing Page').toString().trim();

    if (!name || !phone) {
      return createJsonResponse({
        status: 'error',
        message: 'कृपया नाम और फोन नंबर दर्ज करें।'
      });
    }

    // 2. फोन नंबर को साफ करें (केवल अंतिम 10 अंक लें)
    var cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(-10);
    }

    if (cleanPhone.length < 10) {
      return createJsonResponse({
        status: 'error',
        message: 'अमान्य फोन नंबर।'
      });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // अगर शीट खाली है, तो सुंदर हेडर बनाएं
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'दिनांक व समय (Timestamp)',
        'ग्राहक का नाम (Name)',
        'फोन नंबर (Phone)',
        '10-अंकीय नंबर (Clean Phone)',
        'फॉर्म का प्रकार (Form Source)',
        'स्टेटस (Status)',
        'CRM स्टेटस (CRM Status)'
      ]);
      
      // हेडर स्टाइलिंग
      var headerRange = sheet.getRange(1, 1, 1, 7);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#214728');
      headerRange.setFontColor('#ffffff');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    } else if (sheet.getRange(1, 7).getValue() === '') {
      // अगर शीट में पहले से डेटा है पर 7वां CRM स्टेटस कॉलम नहीं है, तो हेडर जोड़ें
      var crmHeaderCell = sheet.getRange(1, 7);
      crmHeaderCell.setValue('CRM स्टेटस (CRM Status)');
      crmHeaderCell.setFontWeight('bold');
      crmHeaderCell.setBackground('#214728');
      crmHeaderCell.setFontColor('#ffffff');
      crmHeaderCell.setHorizontalAlignment('center');
    }

    var lastRow = sheet.getLastRow();
    var isDuplicate = false;
    var now = new Date().getTime();
    var twentyFourHours = 24 * 60 * 60 * 1000; // 24 घंटे मिलीसेकंड में

    // 3. डुप्लिकेट नंबर चेक लॉजिक (24 घंटे की सीमा)
    if (lastRow > 1) {
      // पहली रो हेडर है, इसलिए 2 से लेकर lastRow तक पढ़ें
      var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
      
      for (var i = 0; i < data.length; i++) {
        var rowTimestamp = data[i][0];
        // कॉलम D (index 3) में साफ फोन नंबर है
        var rowCleanPhone = (data[i][3] || data[i][2] || '').toString().replace(/\D/g, '').slice(-10);
        
        if (rowCleanPhone && rowCleanPhone === cleanPhone) {
          var submissionTime = new Date(rowTimestamp).getTime();
          
          if (!isNaN(submissionTime)) {
            // अगर 24 घंटे के अंदर सबमिट किया गया है
            if ((now - submissionTime) < twentyFourHours) {
              isDuplicate = true;
              break;
            }
          } else {
            // अगर टाइमस्टैम्प पार्स नहीं हो पा रहा है तो भी डुप्लिकेट मानें
            isDuplicate = true;
            break;
          }
        }
      }
    }

    // 4. अगर डुप्लिकेट मिला, तो शीट में दोबारा न जोड़ें और मैसेज भेजें
    if (isDuplicate) {
      return createJsonResponse({
        status: 'duplicate',
        message: 'आपने पहले ही सबमिट कर दिया है, कृपया 24 घंटे प्रतीक्षा करें। हमारे प्रतिनिधि आपसे जल्द ही संपर्क करेंगे।'
      });
    }

    // 5. CRM API में लीड भेजें
    var crmStatus = 'Pending';
    if (CRM_CONFIG.enabled && CRM_CONFIG.url && CRM_CONFIG.token) {
      try {
        var crmUrl = CRM_CONFIG.url + 
          '?name=' + encodeURIComponent(name) +
          '&number=' + encodeURIComponent(cleanPhone) +
          '&token=' + encodeURIComponent(CRM_CONFIG.token) +
          '&channel_id=' + encodeURIComponent(CRM_CONFIG.channel_id) +
          '&product_id=' + encodeURIComponent(CRM_CONFIG.product_id);

        var crmRes = UrlFetchApp.fetch(crmUrl, { muteHttpExceptions: true });
        var crmText = (crmRes.getContentText() || '').trim();
        Logger.log("📡 CRM Raw Response: " + crmText);
        
        var orderId = '';
        try {
          var crmJson = JSON.parse(crmText);
          orderId = crmJson.orderid || crmJson.order_id || crmJson.orderId || '';
        } catch (jsonErr) {}

        // अगर JSON में सीधा orderid नहीं मिला, तो टेक्स्ट से 6+ अंकों का नंबर निकालें
        if (!orderId && crmText) {
          var match = crmText.match(/(\d{6,})/);
          if (match) {
            orderId = match[1];
          }
        }

        if (crmText.toLowerCase().indexOf('new lead captured') !== -1) {
          crmStatus = '✅ New Lead Captured' + (orderId ? ' (Order: ' + orderId + ')' : '');
        } else if (crmText.toLowerCase().indexOf('user already exist') !== -1) {
          crmStatus = '⚠️ User Already Exist';
        } else {
          crmStatus = crmText;
        }
      } catch (crmErr) {
        crmStatus = '❌ CRM Error: ' + crmErr.toString();
      }
    }

    // 6. अगर नया लीड है, तो शीट में नई पंक्ति जोड़ें
    var formattedDate = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() || 'Asia/Kolkata',
      'yyyy-MM-dd HH:mm:ss'
    );

    sheet.appendRow([
      formattedDate,
      name,
      phone,
      cleanPhone,
      formSource,
      'New Lead',
      crmStatus
    ]);

    return createJsonResponse({
      status: 'success',
      crmStatus: crmStatus,
      message: 'धन्यवाद! आपका ऑर्डर सफलतापूर्वक दर्ज कर लिया गया है। हम जल्द ही आपसे संपर्क करेंगे।'
    });

  } catch (error) {
    return createJsonResponse({
      status: 'error',
      message: error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

function createJsonResponse(outputObject) {
  return ContentService
    .createTextOutput(JSON.stringify(outputObject))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
// 🧪 एडिटर में Run बटन दबाकर टेस्ट करने के लिए:
// ==============================================================================
function testSubmission() {
  var randomNum = '9' + Math.floor(100000000 + Math.random() * 900000000);
  var testEvent = {
    parameter: {
      name: "Apps Script Test Lead",
      phone: randomNum,
      cleanPhone: randomNum,
      formSource: "Direct Apps Script Run"
    }
  };
  
  Logger.log("🧪 टेस्ट लीड भेजी जा रही है: " + randomNum);
  var response = handleRequest(testEvent);
  Logger.log("📋 रिजल्ट: " + response.getContent());
}

