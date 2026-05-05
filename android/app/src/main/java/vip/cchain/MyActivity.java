package vip.cchain;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.widget.Toolbar;

import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import org.jacoco.agent.rt.internal_8ff85ea.IExceptionLogger;

public class MyActivity extends AppCompatActivity {

	private Toolbar toolbar;
	private WebView webView;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_my);

		// 获得控件
		webView = (WebView) findViewById(R.id.wv_webview);

		// 声明WebSettings子类
		WebSettings webSettings = webView.getSettings();
		// 如果访问的页面中要与Javascript交互，则webview必须设置支持Javascript
		webSettings.setJavaScriptEnabled(true);
		webSettings.setDomStorageEnabled(true);
		webSettings.setAppCacheEnabled(true);

		// 支持插件
//		webSettings.setPluginsEnabled(true);
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


