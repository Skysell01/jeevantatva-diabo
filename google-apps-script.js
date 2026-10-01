/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT FOR DIABEET / JEEVANTATVA-DIABO LANDING PAGE
 * (PURE GOOGLE SHEETS INTEGRATION - NO CRM)
 * ==============================================================================
 * 
 * निर्देश (Instructions):
 * 1. Google Sheets खोलें।
 * 2. टॉप मेनू में 'Extensions' (एक्सटेंशन) -> 'Apps Script' पर क्लिक करें।
 * 3. वहां मौजूद पुराना कोड हटाकर यह पूरा कोड पेस्ट करें और Save (💾) दबाएं।
 * 4. टॉप राइट में 'Deploy' -> 'New deployment' (या 'Manage deployments' -> Edit -> New version) चुनें।
 * 5. Who has access: "Anyone" रखकर Deploy कर दें।
 * ==============================================================================
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}
function handleRequest(e) {
  var lock = LockService.getScriptLock();
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
      } catch (jsonErr) { }
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

    // 2. 10-अंकीय फोन नंबर निकालें
    var cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(-10);
    }

    if (cleanPhone.length < 10) {
      return createJsonResponse({
        status: 'error',
        message: 'अमान्य फोन नंबर। कृपया 10 अंकों का मोबाइल नंबर दर्ज करें।'
      });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // अगर शीट खाली है, तो सुंदर 6-कॉलम हेडर बनाएं
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'दिनांक व समय (Timestamp)',
        'ग्राहक का नाम (Name)',
        'फोन नंबर (Phone)',
        '10-अंकीय नंबर (Clean Phone)',
        'फॉर्म का प्रकार (Form Source)',
        'स्टेटस (Status)'
      ]);

      var headerRange = sheet.getRange(1, 1, 1, 6);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#214728');
      headerRange.setFontColor('#ffffff');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }

    var lastRow = sheet.getLastRow();
    var isDuplicate = false;
    var now = new Date().getTime();
    var twentyFourHours = 24 * 60 * 60 * 1000;

    // 3. 24 घंटे का डुप्लिकेट चेक (Col 4 / Col 3 से 10-अंकीय नंबर मैच करें)
    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 6)).getValues();
      for (var i = 0; i < data.length; i++) {
        var rowTimestamp = data[i][0];
        var rowCleanPhone = (data[i][3] || data[i][2] || '').toString().replace(/\D/g, '').slice(-10);

        if (rowCleanPhone && rowCleanPhone === cleanPhone) {
          var submissionTime = new Date(rowTimestamp).getTime();
          if (!isNaN(submissionTime)) {
            if ((now - submissionTime) < twentyFourHours) {
              isDuplicate = true;
              break;
            }
          } else {
            isDuplicate = true;
            break;
          }
        }
      }
    }

    // 4. अगर डुप्लिकेट मिला, तो दोबारा न जोड़ें
    if (isDuplicate) {
      return createJsonResponse({
        status: 'duplicate',
        message: 'आपने पहले ही सबमिट कर दिया है, कृपया 24 घंटे प्रतीक्षा करें। हमारे प्रतिनिधि आपसे जल्द ही संपर्क करेंगे।'
      });
    }

    // 5. नई लीड को शीट में जोड़ें
    var formattedDate = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() || 'Asia/Kolkata',
      'yyyy-MM-dd HH:mm:ss'
    );

    sheet.appendRow([
      formattedDate,
      name,
      "'" + phone,
      "'" + cleanPhone,
      formSource,
      'New Lead'
    ]);

    return createJsonResponse({
      status: 'success',
      message: 'धन्यवाद! आपका विवरण सफलतापूर्वक प्राप्त हो गया है। हम जल्द ही आपसे संपर्क करेंगे।'
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
// 🧪 एडिटर में सीधे टेस्ट करने के लिए (Test Sheet Insertion)
// ==============================================================================
function testSheetSubmission() {
  var randomNum = '9' + Math.floor(100000000 + Math.random() * 900000000);
  var testEvent = {
    parameter: {
      name: "Direct Sheet Test",
      phone: randomNum,
      cleanPhone: randomNum,
      formSource: "Apps Script Test"
    }
  };

  Logger.log("🧪 टेस्ट लीड शीट में भेजी जा रही है: " + randomNum);
  var response = handleRequest(testEvent);
  Logger.log("📋 रिजल्ट: " + response.getContent());
}

/**
 * अगर पहले से बने पुराने ट्रिगर्स हटाना चाहें
 */
function removeAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  Logger.log("✅ सभी ट्रिगर्स हटा दिए गए हैं।");
}
