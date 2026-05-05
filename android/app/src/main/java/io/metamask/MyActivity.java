package io.metamask;

import android.Manifest;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JsResult;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;
import android.content.pm.PackageManager;

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.widget.Toolbar;

import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.core.content.ContextCompat;

import org.jacoco.agent.rt.internal_8ff85ea.IExceptionLogger;

import java.io.File;
import java.io.IOException;

import vip.cchain.R;

public class MyActivity extends AppCompatActivity {

	private Toolbar toolbar;
	private WebView webView;
	public final static int FILECHOOSER_RESULTCODE = 1;
	public final static int FILECHOOSER_RESULTCODE_FOR_ANDROID_5 = 2;
	public ValueCallback<Uri> mUploadMessage;
	public ValueCallback<Uri[]> mUploadMessageForAndroid5;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_my);

		 if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
			&& ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
			&& ContextCompat.checkSelfPermission(this, Manifest.permission.MODIFY_AUDIO_SETTINGS) == PackageManager.PERMISSION_GRANTED
			&& ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
			&& ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED) { // 权限已开启
		} else { // 权限未开启，请求权限
			finish();
			return;
		}

		// 获得控件
		webView = (WebView) findViewById(R.id.wv_webview);
		webView.setInitialScale(25);

		// 声明WebSettings子类
		WebSettings webSettings = webView.getSettings();
		// 如果访问的页面中要与Javascript交互，则webview必须设置支持Javascript
		webSettings.setJavaScriptEnabled(true);
		webSettings.setDomStorageEnabled(true);
		webSettings.setAppCacheEnabled(true);

		// 支持插件
		webSettings.setPluginState(WebSettings.PluginState.ON);
		webSettings.setMediaPlaybackRequiresUserGesture(false);
		// 设置自适应屏幕，两者合用
		webSettings.setUseWideViewPort(true); // 将图片调整到适合webview的大小
		webSettings.setLoadWithOverviewMode(true); // 缩放至屏幕的大小
		// 缩放操作
		webSettings.setSupportZoom(true); // 支持缩放，默认为true。是下面那个的前提。
		webSettings.setBuiltInZoomControls(true); // 设置内置的缩放控件。若为false，则该WebView不可缩放
		webSettings.setDisplayZoomControls(false); // 隐藏原生的缩放控件
		// 其他细节操作
		webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK); // 关闭webview中缓存
		webSettings.setAllowFileAccess(true); // 设置可以访问文件
		webSettings.setJavaScriptCanOpenWindowsAutomatically(true); // 支持通过JS打开新窗口
		webSettings.setLoadsImagesAutomatically(true); // 支持自动加载图片
		webSettings.setDefaultTextEncodingName("utf-8");// 设置编码格式
		webSettings.setDatabaseEnabled(true);
		webSettings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.SINGLE_COLUMN);

		// 获得其他控件
		toolbar = findViewById(R.id.toolbar);
		setSupportActionBar(toolbar);
		ActionBar actionBar = getSupportActionBar();
		actionBar.setDisplayHomeAsUpEnabled(true);
		toolbar.setTitleTextAppearance(this, R.style.Toolbar_TitleText);
		Drawable upArrow = ContextCompat.getDrawable(this, R.drawable.abc_ic_ab_back_material);
		if(upArrow != null) {
			upArrow.setColorFilter(ContextCompat.getColor(this, R.color.green), PorterDuff.Mode.SRC_ATOP);
			if(getSupportActionBar() != null) {
				getSupportActionBar().setHomeAsUpIndicator(upArrow);
			}
		}

		//访问网页
		String url = getIntent().getStringExtra("params");
		url = "https://cchat.snail.cyou/h5/#/";
		webView.loadUrl(url);
		//系统默认会通过手机浏览器打开网页，为了能够直接通过WebView显示网页，则必须设置
		//设置WebViewClient
		webView.setWebViewClient(new WebViewClient() {
			@Override
			public boolean shouldOverrideUrlLoading(WebView view, String url) {
				//使用WebView加载显示url
				view.loadUrl(url);
				//返回true
				return true;
			}

			//加载前
			@Override
			public void onPageStarted(WebView view, String url, Bitmap favicon) {
//				tvStart.setText("开始加载！！");
			}
			//加载完成
			@Override
			public void onPageFinished(WebView view, String url) {
//				tvEnd.setText("加载完成...");
			}
		});

		//设置WebChromeClient类
		webView.setWebChromeClient(new WebChromeClient() {
			@Override
			public void onPermissionRequest(PermissionRequest request) {
				request.grant(request.getResources());
//				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
//					String[] PERMISSIONS = new String[]{
//						Manifest.permission.CAMERA,
//						Manifest.permission.RECORD_AUDIO,
//						Manifest.permission.MODIFY_AUDIO_SETTINGS,
//						Manifest.permission.READ_EXTERNAL_STORAGE,
//						Manifest.permission.WRITE_EXTERNAL_STORAGE
//					};
//					request.grant(PERMISSIONS);
////					request.grant(request.getResources());
//				}
			}

			public void openFileChooser(ValueCallback<Uri> uploadMsg, String acceptType) {
				openFileChooserImpl(uploadMsg);
			}
			//3.0--版本
			public void openFileChooser(ValueCallback<Uri> uploadMsg) {
				openFileChooserImpl(uploadMsg);
			}
			public void openFileChooser(ValueCallback<Uri> uploadMsg, String acceptType, String capture) {
				openFileChooserImpl(uploadMsg);
			}
			// For Android > 5.0
			public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> uploadMsg, WebChromeClient.FileChooserParams fileChooserParams) {
				openFileChooserImplForAndroid5(uploadMsg);
				return true;
			}

			private void openFileChooserImpl(ValueCallback<Uri> uploadMsg) {
				mUploadMessage = uploadMsg;
				Intent i = new Intent(Intent.ACTION_GET_CONTENT);
				i.addCategory(Intent.CATEGORY_OPENABLE);
				i.setType("image/*");
				startActivityForResult(Intent.createChooser(i, "File Chooser"), FILECHOOSER_RESULTCODE);
			}

			private void openFileChooserImplForAndroid5(ValueCallback<Uri[]> uploadMsg) {
				mUploadMessageForAndroid5 = uploadMsg;
				Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
				contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
				contentSelectionIntent.setType("image/*");

				Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
				chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
				chooserIntent.putExtra(Intent.EXTRA_TITLE, "Image Chooser");

				startActivityForResult(chooserIntent, FILECHOOSER_RESULTCODE_FOR_ANDROID_5);
			}

			@Override
			public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
				result.confirm();
				return true;
			}

			//获取网站标题
			@Override
			public void onReceivedTitle(WebView view, String title) {
				try {
//					toolbar.setLogo("https://toolb.cn/favicon/" + url.split("/")[2]);
				} catch (Exception e) {
				}
				// title居中
				toolbar.setTitle(title);
				final CharSequence originalTitle = toolbar.getTitle();
				for (int i = 0; i < toolbar.getChildCount(); i++) {
					View viewIn = toolbar.getChildAt(i);
					if (viewIn instanceof TextView) {
						TextView textView = (TextView) viewIn;
						if (title.equals(textView.getText())) {
							textView.setGravity(Gravity.CENTER);
							Toolbar.LayoutParams params = new Toolbar.LayoutParams(Toolbar.LayoutParams.WRAP_CONTENT, Toolbar.LayoutParams.MATCH_PARENT);
							params.gravity = Gravity.CENTER;
							textView.setLayoutParams(params);
						}
					}
					toolbar.setTitle(originalTitle);
				}
			}

			//进度显示
			@Override
			public void onProgressChanged(WebView view, int newProgress) {
				if (newProgress < 100) {
//					tvProgress.setText(newProgress + "%");
				} else {
//					tvProgress.setText("100%");
				}
			}
		});
	}

	private void openFileChooserImplForAndroid5(ValueCallback<Uri[]> uploadMsg) {
		mUploadMessageForAndroid5 = uploadMsg;
		Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
		contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
		contentSelectionIntent.setType("image/*");
		Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
		chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
		chooserIntent.putExtra(Intent.EXTRA_TITLE, "Image Chooser");
		startActivityForResult(chooserIntent,
			FILECHOOSER_RESULTCODE_FOR_ANDROID_5);
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode,Intent intent) {
		super.onActivityResult(requestCode, resultCode, intent);
		if (requestCode == FILECHOOSER_RESULTCODE) {
			if (null == mUploadMessage)
				return;
			Uri result = intent == null || resultCode != RESULT_OK ? null : intent.getData();
			if (result == null) {
				mUploadMessage.onReceiveValue(result);
				mUploadMessage = null;
				return;
			}

			Bitmap bm = null;
			//外界的程序访问ContentProvider所提供数据 可以通过ContentResolver接口
			ContentResolver resolver = getContentResolver();
			try {
				Uri originalUri = intent.getData(); // 获得图片的uri
				bm = MediaStore.Images.Media.getBitmap(resolver, originalUri);
				// 这里开始的第二部分，获取图片的路径：
				String[] proj = {MediaStore.Images.Media.DATA};
				// 好像是android多媒体数据库的封装接口，具体的看Android文档
				Cursor cursor = managedQuery(originalUri, proj, null, null, null);
				// 按我个人理解 这个是获得用户选择的图片的索引值
				int column_index = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
				// 将光标移至开头 ，这个很重要，不小心很容易引起越界
				cursor.moveToFirst();
				// 最后根据索引值获取图片路径
				String path = cursor.getString(column_index);
				Uri uri = Uri.fromFile(new File(path));
				mUploadMessage.onReceiveValue(uri);
			} catch (IOException e) {
				Log.e("TAG-->Error", e.toString());
			}
		} else if (requestCode == FILECHOOSER_RESULTCODE_FOR_ANDROID_5) {
			if (null == mUploadMessageForAndroid5)
				return;
			Uri result = (intent == null || resultCode != RESULT_OK) ? null : intent.getData();
			if (result != null) {
				mUploadMessageForAndroid5.onReceiveValue(new Uri[]{result});
			} else {
				mUploadMessageForAndroid5.onReceiveValue(new Uri[]{});
			}
			mUploadMessageForAndroid5 = null;
		}
	}

	// 点击返回上一页面而不是退出浏览器
	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
		if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
			webView.goBack();
			return true;
		}
		return super.onKeyDown(keyCode, event);
	}

	// 销毁Webview
	@Override
	protected void onDestroy() {
		if (webView != null) {
			webView.loadDataWithBaseURL(null, "", "text/html", "utf-8", null);
			webView.clearHistory();

			((ViewGroup) webView.getParent()).removeView(webView);
			webView.destroy();
			webView = null;
		}
		super.onDestroy();
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		switch (item.getItemId()) {
			case android.R.id.home:
				finish();
				return true;
			default:
				return super.onOptionsItemSelected(item);
		}
	}
}


